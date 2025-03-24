import { useIndexerContext } from "@apibara/indexer";
import { defineIndexerPlugin, useLogger } from "@apibara/indexer/plugins";
import type { Cursor, DataFinality } from "@apibara/protocol";
import type { Database as SqliteDatabase } from "better-sqlite3";

import { generateIndexerId } from "@apibara/indexer/internal";
import { useInternalContext } from "@apibara/indexer/internal/plugins";
import {
  KeyValueStore,
  cleanupKV,
  finalizeKV,
  initializeKeyValueStore,
  invalidateKV,
} from "./kv";
import {
  finalizeState,
  getState,
  initializePersistentState,
  invalidateState,
  persistState,
  resetPersistence,
} from "./persistence";
import {
  type DeserializeFn,
  type SerializeFn,
  SqliteStorageError,
  assertInTransaction,
  deserialize,
  serialize,
  sleep,
  withTransaction,
} from "./utils";

const KV_PROPERTY = "_kv_sqlite" as const;
const MAX_RETRIES = 5;

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
  indexerName?: string;

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
 * @param options.indexerName - The name of the indexer. Defaults value is 'default'.
 */
export function sqliteStorage<TFilter, TBlock>({
  database,
  persistState: enablePersistState = true,
  keyValueStore: enableKeyValueStore = true,
  serialize: serializeFn = serialize,
  deserialize: deserializeFn = deserialize,
  indexerName: identifier = "default",
}: SqliteStorageOptions) {
  return defineIndexerPlugin<TFilter, TBlock>((indexer) => {
    let indexerId = "";
    let prevFinality: DataFinality | undefined;
    const alwaysReindex = process.env["APIBARA_ALWAYS_REINDEX"] === "true";

    indexer.hooks.hook("run:before", async () => {
      const { indexerName: indexerFileName, availableIndexers } =
        useInternalContext();

      const logger = useLogger();

      indexerId = generateIndexerId(indexerFileName, identifier);

      let retries = 0;

      let cleanupApplied = false;

      while (retries <= MAX_RETRIES) {
        try {
          await withTransaction(database, async (db) => {
            if (enablePersistState) {
              initializePersistentState(db);
            }

            if (enableKeyValueStore) {
              initializeKeyValueStore(db);
            }

            if (alwaysReindex && !cleanupApplied) {
              if (enableKeyValueStore) {
                logger.warn("Reindexing: Cleaning up key-value store");
                cleanupKV(db, indexerId);
              }

              if (enablePersistState) {
                logger.warn("Reindexing: Resetting persistence state");
                resetPersistence({ db, indexerId });
              }

              cleanupApplied = true;

              logger.success("All data has been cleaned up for reindexing");
            }
          });
          break;
        } catch (error) {
          if (retries === MAX_RETRIES) {
            throw new SqliteStorageError(
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
      if (!enablePersistState) {
        return;
      }

      return await withTransaction(database, async (db) => {
        const { cursor, filter } = getState<TFilter>({ db, indexerId });

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

      await withTransaction(database, async (db) => {
        if (enablePersistState) {
          invalidateState({ db, cursor, indexerId });
        }

        if (enableKeyValueStore) {
          invalidateKV(db, cursor, indexerId);
        }
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
        persistState({
          db: database,
          endCursor,
          indexerId,
          filter: request.filter[1],
        });
      }
    });

    indexer.hooks.hook("message:finalize", async ({ message }) => {
      const { cursor } = message.finalize;

      if (!cursor) {
        throw new SqliteStorageError("finalized cursor is undefined");
      }

      await withTransaction(database, async (db) => {
        if (enablePersistState) {
          finalizeState({ db, cursor, indexerId });
        }

        if (enableKeyValueStore) {
          finalizeKV(db, cursor, indexerId);
        }
      });
    });

    indexer.hooks.hook("message:invalidate", async ({ message }) => {
      const { cursor } = message.invalidate;

      if (!cursor) {
        throw new SqliteStorageError("invalidate cursor is undefined");
      }

      await withTransaction(database, async (db) => {
        if (enablePersistState) {
          invalidateState({ db, cursor, indexerId });
        }

        if (enableKeyValueStore) {
          invalidateKV(db, cursor, indexerId);
        }
      });
    });

    indexer.hooks.hook("handler:middleware", ({ use }) => {
      use(async (ctx, next) => {
        const { endCursor, finality, cursor } = ctx as {
          cursor: Cursor;
          endCursor: Cursor;
          finality: DataFinality;
        };

        if (!finality) {
          throw new SqliteStorageError("finality is undefined");
        }

        if (!endCursor) {
          throw new SqliteStorageError(
            "endCursor is undefined or not a cursor",
          );
        }

        await withTransaction(database, async (db) => {
          if (prevFinality === "pending") {
            // invalidate if previous block's finality was "pending"
            if (enableKeyValueStore) {
              invalidateKV(db, cursor, indexerId);
            }
          }

          if (enableKeyValueStore) {
            ctx[KV_PROPERTY] = new KeyValueStore(
              db,
              endCursor,
              finality,
              serializeFn,
              deserializeFn,
              indexerId,
            );
          }

          await next();

          if (enablePersistState && finality !== "pending") {
            persistState({ db, endCursor, indexerId });
          }

          if (enableKeyValueStore) {
            delete ctx[KV_PROPERTY];
          }

          prevFinality = finality;
        });
      });
    });
  });
}
