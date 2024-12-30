import { useIndexerContext } from "@apibara/indexer";
import { defineIndexerPlugin } from "@apibara/indexer/plugins";

import type {
  ExtractTablesWithRelations,
  TablesRelationalConfig,
} from "drizzle-orm";

import type {
  PgDatabase,
  PgQueryResultHKT,
  PgTransaction,
} from "drizzle-orm/pg-core";
import {
  finalizeState,
  getState,
  initializePersistentState,
  invalidateState,
  persistState,
} from "./persistence";
import {
  initializeReorgRollbackTable,
  registerTriggers,
  removeTriggers,
} from "./storage";
import { DrizzleStorageError, withTransaction } from "./utils";

const DRIZZLE_PROPERTY = "_drizzle";

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
  _db: PgDatabase<TQueryResult, TFullSchema, TSchema>,
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
}

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
  indexerName,
  schema = {},
  idColumn = "id",
}: DrizzleStorageOptions<TQueryResult, TFullSchema, TSchema>) {
  return defineIndexerPlugin<TFilter, TBlock>((indexer) => {
    const tableNames = Object.keys(schema ?? db._.schema);

    indexer.hooks.hook("run:before", async () => {
      await withTransaction(db, async (tx) => {
        await initializeReorgRollbackTable(tx);
        if (enablePersistence) {
          await initializePersistentState(tx);
        }
      });
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
          indexerName,
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
        // TODO: Implement invalidate for drizzle/reorg table maybe?
        // await invalidate(db, cursor, tables);

        if (enablePersistence) {
          await invalidateState({ tx, cursor, indexerName });
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
          indexerName,
        });
      }
    });

    indexer.hooks.hook("message:finalize", async ({ message }) => {
      const { cursor } = message.finalize;

      if (!cursor) {
        throw new DrizzleStorageError("finalized cursor is undefined");
      }

      await withTransaction(db, async (tx) => {
        // TODO: Implement finalize for drizzle/reorg table maybe?
        // await finalize(db, cursor, tables);

        if (enablePersistence) {
          await finalizeState({ tx, cursor, indexerName });
        }
      });
    });

    indexer.hooks.hook("message:invalidate", async ({ message }) => {
      const { cursor } = message.invalidate;

      if (!cursor) {
        throw new DrizzleStorageError("invalidate cursor is undefined");
      }

      await withTransaction(db, async (tx) => {
        // TODO: Implement invalidate for drizzle/reorg table maybe?
        // await invalidate(db, cursor, tables);

        if (enablePersistence) {
          await invalidateState({ tx, cursor, indexerName });
        }
      });
    });

    indexer.hooks.hook("handler:middleware", async ({ use }) => {
      use(async (context, next) => {
        const { endCursor } = context;

        if (!endCursor) {
          throw new DrizzleStorageError("end cursor is undefined");
        }

        await withTransaction(db, async (tx) => {
          context[DRIZZLE_PROPERTY] = { db: tx } as DrizzleStorage<
            TQueryResult,
            TFullSchema,
            TSchema
          >;

          await registerTriggers(tx, tableNames, endCursor, idColumn);

          await next();
          delete context[DRIZZLE_PROPERTY];

          if (enablePersistence) {
            await persistState({
              tx,
              endCursor,
              indexerName,
            });
          }
        });

        // remove trigger outside of the transaction or it won't be triggered.
        await removeTriggers(db, tableNames);
      });
    });
  });
}
