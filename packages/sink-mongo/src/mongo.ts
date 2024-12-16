import { Sink, type SinkCursorParams } from "@apibara/indexer";
import type { Cursor } from "@apibara/protocol";
import type { ClientSession, DbOptions, MongoClient } from "mongodb";
import { MongoSinkTransactionDb } from "./transaction";

export interface MongoSinkOptions {
  client: MongoClient;
  dbName: string;
  dbOptions?: DbOptions;
  collections: string[];
}

export class MongoSink extends Sink {
  constructor(
    private client: MongoClient,
    private config: Omit<MongoSinkOptions, "client">,
  ) {
    super();
  }

  async transaction(
    { cursor, endCursor, finality }: SinkCursorParams,
    cb: (params: {
      db: MongoSinkTransactionDb;
      session: ClientSession;
    }) => Promise<void>,
  ): Promise<void> {
    await this.client.withSession(async (session) =>
      session.withTransaction(async (session) => {
        const db = this.client.db(this.config.dbName, this.config.dbOptions);
        await cb({
          db: new MongoSinkTransactionDb(db, session, endCursor),
          session,
        });
        return "Transaction committed.";
      }),
    );
  }

  async finalize(cursor?: Cursor) {
    if (cursor?.orderKey === undefined) return;

    await this.client.withSession(async (session) =>
      session.withTransaction(async (session) => {
        const db = this.client.db(this.config.dbName, this.config.dbOptions);
        const orderKeyValue = Number(cursor.orderKey);

        for (const collection of this.config.collections) {
          // Delete documents where the upper bound of _cursor is less than the finalize cursor
          await db.collection(collection).deleteMany(
            {
              "_cursor.to": { $lt: orderKeyValue },
            },
            { session },
          );
        }
      }),
    );
  }

  async invalidate(cursor?: Cursor) {
    if (cursor?.orderKey === undefined) return;

    this.client.withSession(async (session) =>
      session.withTransaction(async (session) => {
        const db = this.client.db(this.config.dbName, this.config.dbOptions);
        const orderKeyValue = Number(cursor.orderKey);
        for (const collection of this.config.collections) {
          // Delete documents where the lower bound of _cursor is greater than the invalidate cursor
          await db.collection(collection).deleteMany(
            {
              "cursor.from": {
                $gt: orderKeyValue,
              },
            },
            { session },
          );

          // Update documents where the upper bound of _cursor is greater than the invalidate cursor
          await db.collection(collection).updateMany(
            { "_cursor.to": { $gt: orderKeyValue } },
            {
              $set: {
                "_cursor.to": null,
              },
            },
            { session },
          );
        }
      }),
    );
  }

  async invalidateOnRestart(cursor?: Cursor) {
    await this.invalidate(cursor);
  }
}

export const mongo = (args: MongoSinkOptions) => {
  const { client, ...rest } = args;
  return new MongoSink(client, rest);
};
