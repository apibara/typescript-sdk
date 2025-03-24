import { useIndexerContext } from "@apibara/indexer";
import { defineIndexerPlugin, useLogger } from "@apibara/indexer/plugins";

import type {
  ExtractTablesWithRelations,
  TablesRelationalConfig,
} from "drizzle-orm";

import { generateIndexerId } from "@apibara/indexer/internal";
import { useInternalContext } from "@apibara/indexer/internal/plugins";
import type { Cursor, DataFinality } from "@apibara/protocol";
import type {
  PgDatabase,
  PgQueryResultHKT,
  PgTransaction,
} from "drizzle-orm/pg-core";
import { DRIZZLE_PROPERTY, DRIZZLE_STORAGE_DB_PROPERTY } from "./constants";
import { type MigrateOptions, migrate } from "./helper";
import {
  finalizeState,
  getState,
  initializePersistentState,
  invalidateState,
  persistState,
  resetPersistence,
} from "./persistence";
import {
  cleanupStorage,
  finalize,
  initializeReorgRollbackTable,
  invalidate,
  registerTriggers,
  removeTriggers,
} from "./storage";
import {
  DrizzleStorageError,
  type IdColumnMap,
  getIdColumnForTable,
  sleep,
  withTransaction,
} from "./utils";

export * from "./helper";

export type { IdColumnMap };

const MAX_RETRIES = 5;

export type DrizzleStorage<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
> = {
  db: PgTransaction<TQueryResult, TFullSchema, TSchema>;
};

export function useDrizzleStorage<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(
  _db?: PgDatabase<TQueryResult, TFullSchema, TSchema>,
): DrizzleStorage<TQueryResult, TFullSchema, TSchema> {
  const context = useIndexerContext();

  if (!context[DRIZZLE_PROPERTY]) {
    throw new DrizzleStorageError(
      "drizzle storage is not available. Did you register the plugin?",
    );
  }

  return context[DRIZZLE_PROPERTY];
}

export interface DrizzleStorageOptions<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
> {
  /**
   * The Drizzle database instance.
   */
  db: PgDatabase<TQueryResult, TFullSchema, TSchema>;
  /**
   * Whether to persist the indexer's state. Defaults to true.
   */
  persistState?: boolean;
  /**
   * The name of the indexer. Default value is 'default'.
   */
  indexerName?: string;
  /**
   * The schema of the database.
   */
  schema?: Record<string, unknown>;
  /**
   * The column to use as the primary identifier for each table.
   *
   * This identifier is used for tracking changes during reorgs and rollbacks.
   *
   * Can be specified in two ways:
   *
   * 1. As a single string that applies to all tables:
   * ```ts
   * idColumn: "_id" // Uses "_id" column for all tables
   * ```
   *
   * 2. As an object mapping table names to their ID columns:
   * ```ts
   * idColumn: {
   *   transfers: "transaction_hash",    // Use "transaction_hash" for transfers table
   *   blocks: "block_number",           // Use "block_number" for blocks table
   *   "*": "_id"                        // Use "_id" for all other tables | defaults to "id"
   * }
   * ```
   *
   * The special "*" key acts as a fallback for any tables not explicitly mapped.
   *
   * @default "id"
   * @type {string | Partial<IdColumnMap>}
   */
  idColumn?: string | Partial<IdColumnMap>;
  /**
   * The options for the database migration. When provided, the database will automatically run migrations before the indexer runs.
   */
  migrate?: MigrateOptions;
}

/**
 * Creates a plugin that uses Drizzle as the storage layer.
 *
 * Supports storing the indexer's state and provides a simple Key-Value store.
 * @param options.db - The Drizzle database instance.
 * @param options.persistState - Whether to persist the indexer's state. Defaults to true.
 * @param options.indexerName - The name of the indexer. Defaults value is 'default'.
 * @param options.schema - The schema of the database.
 * @param options.idColumn - The column to use as the id. Defaults to 'id'.
 * @param options.migrate - The options for the database migration. when provided, the database will automatically run migrations before the indexer runs.
 */
export function drizzleStorage<
  TFilter,
  TBlock,
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>({
  db,
  persistState: enablePersistence = true,
  indexerName: identifier = "default",
  schema: _schema,
  idColumn,
  migrate: migrateOptions,
}: DrizzleStorageOptions<TQueryResult, TFullSchema, TSchema>) {
  return defineIndexerPlugin<TFilter, TBlock>((indexer) => {
    let tableNames: string[] = [];
    let indexerId = "";
    const alwaysReindex = process.env["APIBARA_ALWAYS_REINDEX"] === "true";
    let prevFinality: DataFinality | undefined;
    const schema: TSchema = (_schema as TSchema) ?? db._.schema ?? {};
    const idColumnMap: IdColumnMap = {
      "*": typeof idColumn === "string" ? idColumn : "id",
      ...(typeof idColumn === "object" ? idColumn : {}),
    };

    try {
      tableNames = Object.values(schema).map((table) => table.dbName);
    } catch (error) {
      throw new DrizzleStorageError("Failed to get table names from schema", {
        cause: error,
      });
    }

    // Check if specified idColumn exists in all the tables in schema
    for (const table of Object.values(schema)) {
      const columns = table.columns;
      const tableIdColumn = getIdColumnForTable(table.dbName, idColumnMap);

      const columnExists = Object.values(columns).some(
        (column) => column.name === tableIdColumn,
      );

      if (!columnExists) {
        throw new DrizzleStorageError(
          `Column \`"${tableIdColumn}"\` does not exist in table \`"${table.dbName}"\`. ` +
            "Make sure the table has the specified column or provide a valid `idColumn` mapping to `drizzleStorage`.",
        );
      }
    }

    indexer.hooks.hook("run:before", async () => {
      const internalContext = useInternalContext();
      const context = useIndexerContext();
      const logger = useLogger();

      // For testing purposes using vcr.
      context[DRIZZLE_STORAGE_DB_PROPERTY] = db;

      const { indexerName: indexerFileName, availableIndexers } =
        internalContext;

      indexerId = generateIndexerId(indexerFileName, identifier);

      let retries = 0;

      // incase the migrations are already applied, we don't want to run them again
      let migrationsApplied = false;
      let cleanupApplied = false;

      while (retries <= MAX_RETRIES) {
        try {
          if (migrateOptions && !migrationsApplied) {
            // @ts-ignore type mismatch for db
            await migrate(db, migrateOptions);
            migrationsApplied = true;
            logger.success("Migrations applied");
          }
          await withTransaction(db, async (tx) => {
            await initializeReorgRollbackTable(tx, indexerId);
            if (enablePersistence) {
              await initializePersistentState(tx);
            }

            if (alwaysReindex && !cleanupApplied) {
              logger.warn(
                `Reindexing: Deleting all data from tables - ${tableNames.join(", ")}`,
              );

              await cleanupStorage(tx, tableNames, indexerId);

              if (enablePersistence) {
                await resetPersistence({ tx, indexerId });
              }

              cleanupApplied = true;

              logger.success("Tables have been cleaned up for reindexing");
            }
          });
          break;
        } catch (error) {
          if (retries === MAX_RETRIES) {
            if (error instanceof DrizzleStorageError) {
              throw error;
            }
            throw new DrizzleStorageError(
              "Initialization failed after 5 retries",
              {
                cause: error,
              },
            );
          }
          await sleep(retries * 1000);
          retries++;
        }
      }
    });

    indexer.hooks.hook("connect:before", async ({ request }) => {
      if (!enablePersistence) {
        return;
      }

      await withTransaction(db, async (tx) => {
        const { cursor, filter } = await getState<
          TFilter,
          TQueryResult,
          TFullSchema,
          TSchema
        >({
          tx,
          indexerId,
        });
        if (cursor) {
          request.startingCursor = cursor;
        }
        if (filter) {
          request.filter[1] = filter;
        }
      });
    });

    indexer.hooks.hook("connect:after", async ({ request }) => {
      // On restart, we need to invalidate data for blocks that were processed but not persisted.
      const cursor = request.startingCursor;

      if (!cursor) {
        return;
      }

      await withTransaction(db, async (tx) => {
        // Use the appropriate idColumn for each table when calling invalidate
        await invalidate(tx, cursor, idColumnMap, indexerId);

        if (enablePersistence) {
          await invalidateState({ tx, cursor, indexerId });
        }
      });
    });

    indexer.hooks.hook("connect:factory", async ({ request, endCursor }) => {
      if (!enablePersistence) {
        return;
      }
      // We can call this hook because this hook is called inside the transaction of handler:middleware
      // so we have access to the transaction from the context
      const { db: tx } = useDrizzleStorage(db);

      if (endCursor && request.filter[1]) {
        await persistState({
          tx,
          endCursor,
          filter: request.filter[1],
          indexerId,
        });
      }
    });

    indexer.hooks.hook("message:finalize", async ({ message }) => {
      const { cursor } = message.finalize;

      if (!cursor) {
        throw new DrizzleStorageError("Finalized Cursor is undefined");
      }

      await withTransaction(db, async (tx) => {
        await finalize(tx, cursor, indexerId);

        if (enablePersistence) {
          await finalizeState({ tx, cursor, indexerId });
        }
      });
    });

    indexer.hooks.hook("message:invalidate", async ({ message }) => {
      const { cursor } = message.invalidate;

      if (!cursor) {
        throw new DrizzleStorageError("Invalidate Cursor is undefined");
      }

      await withTransaction(db, async (tx) => {
        // Use the appropriate idColumn for each table when calling invalidate
        await invalidate(tx, cursor, idColumnMap, indexerId);

        if (enablePersistence) {
          await invalidateState({ tx, cursor, indexerId });
        }
      });
    });

    indexer.hooks.hook("handler:middleware", async ({ use }) => {
      use(async (context, next) => {
        try {
          const { endCursor, finality, cursor } = context as {
            cursor: Cursor;
            endCursor: Cursor;
            finality: DataFinality;
          };

          if (!endCursor) {
            throw new DrizzleStorageError("End Cursor is undefined");
          }

          await withTransaction(db, async (tx) => {
            context[DRIZZLE_PROPERTY] = { db: tx } as DrizzleStorage<
              TQueryResult,
              TFullSchema,
              TSchema
            >;

            if (prevFinality === "pending") {
              // invalidate if previous block's finality was "pending"
              await invalidate(tx, cursor, idColumnMap, indexerId);
            }

            if (finality !== "finalized") {
              await registerTriggers(
                tx,
                tableNames,
                endCursor,
                idColumnMap,
                indexerId,
              );
            }

            await next();
            delete context[DRIZZLE_PROPERTY];

            if (enablePersistence && finality !== "pending") {
              await persistState({
                tx,
                endCursor,
                indexerId,
              });
            }

            prevFinality = finality;
          });

          if (finality !== "finalized") {
            // remove trigger outside of the transaction or it won't be triggered.
            await removeTriggers(db, tableNames, indexerId);
          }
        } catch (error) {
          await removeTriggers(db, tableNames, indexerId);

          throw new DrizzleStorageError("Failed to run handler:middleware", {
            cause: error,
          });
        }
      });
    });
  });
}
