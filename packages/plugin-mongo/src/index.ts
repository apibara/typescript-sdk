import { useIndexerContext } from "@apibara/indexer";
import { defineIndexerPlugin, useLogger } from "@apibara/indexer/plugins";
import type { DbOptions, MongoClient } from "mongodb";

import { generateIndexerId } from "@apibara/indexer/internal";
import { useInternalContext } from "@apibara/indexer/internal/plugins";
import type { Cursor, DataFinality } from "@apibara/protocol";
import { cleanupStorage, finalize, invalidate } from "./mongo";
import {
  finalizeState,
  getState,
  initializePersistentState,
  invalidateState,
  persistState,
  resetPersistence,
} from "./persistence";
import { MongoStorage } from "./storage";
import { MongoStorageError, withTransaction } from "./utils";

export { MongoCollection, MongoStorage } from "./storage";

const MONGO_PROPERTY = "_mongo";

export function useMongoStorage(): MongoStorage {
  const context = useIndexerContext();

  if (!context[MONGO_PROPERTY]) {
    throw new MongoStorageError(
      "mongo storage is not available. Did you register the plugin?",
    );
  }

  return context[MONGO_PROPERTY] as MongoStorage;
}

export interface MongoStorageOptions {
  client: MongoClient;
  dbName: string;
  dbOptions?: DbOptions;
  collections: string[];
  persistState?: boolean;
  indexerName?: string;
}
/**
 * Creates a plugin that uses MongoDB as the storage layer.
 *
 * Supports storing the indexer's state and provides a simple Key-Value store.
 * @param options.client - The MongoDB client instance.
 * @param options.dbName - The name of the database.
 * @param options.dbOptions - The database options.
 * @param options.collections - The collections to use.
 * @param options.persistState - Whether to persist the indexer's state. Defaults to true.
 * @param options.indexerName - The name of the indexer. Defaults value is 'default'.
 */
export function mongoStorage<TFilter, TBlock>({
  client,
  dbName,
  dbOptions,
  collections,
  persistState: enablePersistence = true,
  indexerName: identifier = "default",
}: MongoStorageOptions) {
  return defineIndexerPlugin<TFilter, TBlock>((indexer) => {
    let indexerId = "";
    const alwaysReindex = process.env["APIBARA_ALWAYS_REINDEX"] === "true";
    let prevFinality: DataFinality | undefined;

    indexer.hooks.hook("run:before", async () => {
      const { indexerName } = useInternalContext();
      indexerId = generateIndexerId(indexerName, identifier);
      const logger = useLogger();

      await withTransaction(client, async (session) => {
        const db = client.db(dbName, dbOptions);
        if (enablePersistence) {
          await initializePersistentState(db, session);
        }

        if (alwaysReindex) {
          logger.warn(
            `Reindexing: Deleting all data from collections - ${collections.join(", ")}`,
          );

          await cleanupStorage(db, session, collections);

          if (enablePersistence) {
            await resetPersistence({ db, session, indexerId });
          }

          logger.success("All data has been cleaned up for reindexing");
        }
      });
    });

    indexer.hooks.hook("connect:before", async ({ request }) => {
      if (!enablePersistence) {
        return;
      }

      await withTransaction(client, async (session) => {
        const db = client.db(dbName, dbOptions);
        const { cursor, filter } = await getState<TFilter>({
          db,
          session,
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

      await withTransaction(client, async (session) => {
        const db = client.db(dbName, dbOptions);
        await invalidate(db, session, cursor, collections);

        if (enablePersistence) {
          await invalidateState({ db, session, cursor, indexerId });
        }
      });
    });

    indexer.hooks.hook("connect:factory", async ({ request, endCursor }) => {
      if (!enablePersistence) {
        return;
      }
      await withTransaction(client, async (session) => {
        const db = client.db(dbName, dbOptions);
        if (endCursor && request.filter[1]) {
          await persistState({
            db,
            endCursor,
            session,
            filter: request.filter[1],
            indexerId,
          });
        }
      });
    });

    indexer.hooks.hook("message:finalize", async ({ message }) => {
      const { cursor } = message.finalize;

      if (!cursor) {
        throw new MongoStorageError("finalized cursor is undefined");
      }

      await withTransaction(client, async (session) => {
        const db = client.db(dbName, dbOptions);
        await finalize(db, session, cursor, collections);

        if (enablePersistence) {
          await finalizeState({ db, session, cursor, indexerId });
        }
      });
    });

    indexer.hooks.hook("message:invalidate", async ({ message }) => {
      const { cursor } = message.invalidate;

      if (!cursor) {
        throw new MongoStorageError("invalidate cursor is undefined");
      }

      await withTransaction(client, async (session) => {
        const db = client.db(dbName, dbOptions);
        await invalidate(db, session, cursor, collections);

        if (enablePersistence) {
          await invalidateState({ db, session, cursor, indexerId });
        }
      });
    });

    indexer.hooks.hook("handler:middleware", async ({ use }) => {
      use(async (context, next) => {
        const { endCursor, finality, cursor } = context as {
          cursor: Cursor;
          endCursor: Cursor;
          finality: DataFinality;
        };

        if (!endCursor) {
          throw new MongoStorageError("end cursor is undefined");
        }

        await withTransaction(client, async (session) => {
          const db = client.db(dbName, dbOptions);
          context[MONGO_PROPERTY] = new MongoStorage(db, session, endCursor);

          if (prevFinality === "pending") {
            // invalidate if previous block's finality was "pending"
            await invalidate(db, session, cursor, collections);
          }

          await next();

          delete context[MONGO_PROPERTY];

          if (enablePersistence && finality !== "pending") {
            await persistState({
              db,
              endCursor,
              session,
              indexerId,
            });
          }

          prevFinality = finality;
        });
      });
    });
  });
}
