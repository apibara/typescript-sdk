import type { Cursor } from "@apibara/protocol";
import type { ClientSession, CollectionOptions, Db, Document } from "mongodb";
import { MongoSinkCollection } from "./collection";

export class MongoSinkTransactionDb {
  constructor(
    private db: Db,
    private session: ClientSession,
    private endCursor?: Cursor,
  ) {}

  collection<TSchema extends Document = Document>(
    name: string,
    options?: CollectionOptions,
  ) {
    const collection = this.db.collection<TSchema>(name, options);

    return new MongoSinkCollection<TSchema>(
      this.session,
      collection,
      this.endCursor,
    );
  }
}
