import { useIndexerContext } from "@apibara/indexer";
import { defineIndexerPlugin } from "@apibara/indexer/plugins";
import type { DbOptions, MongoClient } from "mongodb";

import { finalize, invalidate } from "./mongo";
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
}

export function mongoStorage<TFilter, TBlock>({
  client,
  dbName,
  dbOptions,
  collections,
  persistState: enablePersistence = true,
}: MongoStorageOptions) {
  return defineIndexerPlugin<TFilter, TBlock>((indexer) => {
    indexer.hooks.hook("message:finalize", async ({ message }) => {
      const { cursor } = message.finalize;

      if (!cursor) {
        throw new MongoStorageError("finalized cursor is undefined");
      }

      await withTransaction(client, async (session) => {
        const db = client.db(dbName, dbOptions);
        await finalize(db, session, cursor, collections);
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
      });
    });

    indexer.hooks.hook("handler:middleware", async ({ use }) => {
      use(async (context, next) => {
        const { endCursor } = context;

        if (!endCursor) {
          throw new MongoStorageError("end cursor is undefined");
        }

        await withTransaction(client, async (session) => {
          const db = client.db(dbName, dbOptions);
          context[MONGO_PROPERTY] = new MongoStorage(db, session, endCursor);

          await next();

          delete context[MONGO_PROPERTY];

          if (enablePersistence) {
            // TODO: persist state
          }
        });
      });
    });
  });
}
