import { useIndexerContext } from "@apibara/indexer";
import { defineIndexerPlugin } from "@apibara/indexer/plugins";

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
import { type MigrateOptions, migrate } from "./helper";
import {
  finalizeState,
  getState,
  initializePersistentState,
  invalidateState,
  persistState,
} from "./persistence";
import {
  finalize,
  initializeReorgRollbackTable,
  invalidate,
  registerTriggers,
  removeTriggers,
} from "./storage";
import { DrizzleStorageError, sleep, withTransaction } from "./utils";

const DRIZZLE_PROPERTY = "_drizzle";
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
  db: PgDatabase<TQueryResult, TFullSchema, TSchema>;
  persistState?: boolean;
  indexerName?: string;
  schema?: Record<string, unknown>;
  idColumn?: string;
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
  schema,
  idColumn = "id",
  migrate: migrateOptions,
}: DrizzleStorageOptions<TQueryResult, TFullSchema, TSchema>) {
  return defineIndexerPlugin<TFilter, TBlock>((indexer) => {
    let tableNames: string[] = [];
    let indexerId = "";

    try {
      tableNames = Object.values((schema as TSchema) ?? db._.schema ?? {}).map(
        (table) => table.dbName,
      );
    } catch (error) {
      throw new DrizzleStorageError("Failed to get table names from schema", {
        cause: error,
      });
    }

    indexer.hooks.hook("run:before", async () => {
      const context = useInternalContext();

      // @ts-ignore drizzleStorageDB missing error.
      context["drizzleStorageDB"] = db;

      const { indexerName: indexerFileName, availableIndexers } = context;

      indexerId = generateIndexerId(indexerFileName, identifier);

      let retries = 0;

      while (retries <= MAX_RETRIES) {
        try {
          if (migrateOptions) {
            // @ts-ignore type mismatch for db
            await migrate(db, migrateOptions);
          }
          await withTransaction(db, async (tx) => {
            await initializeReorgRollbackTable(tx, indexerId);
            if (enablePersistence) {
              await initializePersistentState(tx);
            }
          });
          break;
        } catch (error) {
          if (retries === MAX_RETRIES) {
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
        await invalidate(tx, cursor, idColumn, indexerId);

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
        await invalidate(tx, cursor, idColumn, indexerId);

        if (enablePersistence) {
          await invalidateState({ tx, cursor, indexerId });
        }
      });
    });

    indexer.hooks.hook("handler:middleware", async ({ use }) => {
      use(async (context, next) => {
        try {
          const { endCursor, finality } = context as {
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

            if (finality !== "finalized") {
              await registerTriggers(
                tx,
                tableNames,
                endCursor,
                idColumn,
                indexerId,
              );
            }

            await next();
            delete context[DRIZZLE_PROPERTY];

            if (enablePersistence) {
              await persistState({
                tx,
                endCursor,
                indexerId,
              });
            }
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
