import { useIndexerContext } from "@apibara/indexer";
import { defineIndexerPlugin } from "@apibara/indexer/plugins";
import { isCursor } from "@apibara/protocol";
import type { Database as SqliteDatabase } from "better-sqlite3";

import { KeyValueStore, initializeKeyValueStore } from "./kv";
import {
  getState,
  initializePersistentState,
  persistState,
} from "./persistence";
import {
  type DeserializeFn,
  type SerializeFn,
  SqliteStorageError,
  assertInTransaction,
  deserialize,
  serialize,
  withTransaction,
} from "./utils";

const KV_PROPERTY = "_kv_sqlite" as const;

export { KeyValueStore } from "./kv";

export function useSqliteKeyValueStore(): KeyValueStore {
  const kv = useIndexerContext()[KV_PROPERTY] as KeyValueStore | undefined;
  if (!kv) {
    throw new SqliteStorageError(
      "SQLite key-value store is not available. Did you forget to enable it?",
    );
  }

  return kv;
}

export type SqliteStorageOptions = {
  database: SqliteDatabase;
  keyValueStore?: boolean;
  persistState?: boolean;

  serialize?: SerializeFn;
  deserialize?: DeserializeFn;
};

/**
 * Creates a plugin that uses SQLite as the storage layer.
 *
 * Supports storing the indexer's state and provides a simple Key-Value store.
 * @param options.database - The SQLite database instance.
 * @param options.persistState - Whether to persist the indexer's state. Defaults to true.
 * @param options.keyValueStore - Whether to enable the Key-Value store. Defaults to true.
 * @param options.serialize - A function to serialize the value to the KV.
 * @param options.deserialize - A function to deserialize the value from the KV.
 */
export function sqliteStorage<TFilter, TBlock>({
  database,
  persistState: enablePersistState = true,
  keyValueStore: enableKeyValueStore = true,
  serialize: serializeFn = serialize,
  deserialize: deserializeFn = deserialize,
}: SqliteStorageOptions) {
  return defineIndexerPlugin<TFilter, TBlock>((indexer) => {
    indexer.hooks.hook("run:before", async () => {
      await withTransaction(database, async (db) => {
        if (enablePersistState) {
          initializePersistentState(db);
        }

        if (enableKeyValueStore) {
          initializeKeyValueStore(db);
        }
      });
    });

    indexer.hooks.hook("connect:before", async ({ request }) => {
      if (!enablePersistState) {
        return;
      }

      return await withTransaction(database, async (db) => {
        const { cursor, filter } = getState<TFilter>(db);

        if (cursor) {
          request.startingCursor = cursor;
        }

        if (filter) {
          request.filter[1] = filter;
        }
      });
    });

    indexer.hooks.hook("handler:middleware", ({ use }) => {
      use(async (ctx, next) => {
        if (!ctx.finality) {
          throw new SqliteStorageError("finality is undefined");
        }

        if (!ctx.endCursor || !isCursor(ctx.endCursor)) {
          throw new SqliteStorageError(
            "endCursor is undefined or not a cursor",
          );
        }

        await withTransaction(database, async (db) => {
          if (enableKeyValueStore) {
            ctx[KV_PROPERTY] = new KeyValueStore(
              db,
              ctx.endCursor,
              ctx.finality,
              serializeFn,
              deserializeFn,
            );
          }

          await next();

          if (enablePersistState) {
            persistState(db, ctx.endCursor);
          }

          if (enableKeyValueStore) {
            delete ctx[KV_PROPERTY];
          }
        });
      });
    });

    indexer.hooks.hook("connect:factory", ({ request, endCursor }) => {
      if (!enablePersistState) {
        return;
      }

      // The connect factory hook is called while indexing a block, so the database should be in a transaction
      // created by the middleware.
      assertInTransaction(database);

      if (endCursor && request.filter[1]) {
        persistState(database, endCursor, request.filter[1]);
      }
    });
  });
}
