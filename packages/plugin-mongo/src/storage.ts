import type { Cursor } from "@apibara/protocol";
import type {
  BulkWriteOptions,
  ClientSession,
  Collection,
  CollectionOptions,
  Db,
  DeleteOptions,
  Document,
  Filter,
  FindCursor,
  FindOneAndUpdateOptions,
  FindOptions,
  InsertManyResult,
  InsertOneOptions,
  InsertOneResult,
  MatchKeysAndValues,
  OptionalUnlessRequiredId,
  UpdateFilter,
  UpdateOptions,
  UpdateResult,
  WithId,
} from "mongodb";

export class MongoStorage {
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

    return new MongoCollection<TSchema>(
      this.session,
      collection,
      this.endCursor,
    );
  }
}

export type MongoCursor = {
  from: number | null;
  to: number | null;
};

export type CursoredSchema<TSchema extends Document> = TSchema & {
  _cursor: MongoCursor;
};

export class MongoCollection<TSchema extends Document> {
  constructor(
    private session: ClientSession,
    private collection: Collection<TSchema>,
    private endCursor?: Cursor,
  ) {}

  async insertOne(
    doc: OptionalUnlessRequiredId<TSchema>,
    options?: InsertOneOptions,
  ): Promise<InsertOneResult<TSchema>> {
    return await this.collection.insertOne(
      {
        ...doc,
        _cursor: {
          from: Number(this.endCursor?.orderKey),
          to: null,
        } as MongoCursor,
      },
      { ...options, session: this.session },
    );
  }

  async insertMany(
    docs: ReadonlyArray<OptionalUnlessRequiredId<TSchema>>,
    options?: BulkWriteOptions,
  ): Promise<InsertManyResult<TSchema>> {
    return await this.collection.insertMany(
      docs.map((doc) => ({
        ...doc,
        _cursor: {
          from: Number(this.endCursor?.orderKey),
          to: null,
        } as MongoCursor,
      })),
      { ...options, session: this.session },
    );
  }

  async updateOne(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options?: UpdateOptions,
  ): Promise<UpdateResult<TSchema>> {
    // 1. Find and update the document, getting the old version
    const oldDoc = await this.collection.findOneAndUpdate(
      {
        ...filter,
        "_cursor.to": null,
      },
      {
        ...update,
        $set: {
          ...update.$set,
          "_cursor.from": Number(this.endCursor?.orderKey),
        } as unknown as MatchKeysAndValues<TSchema>,
      },
      {
        ...options,
        session: this.session,
        returnDocument: "before",
      } as FindOneAndUpdateOptions,
    );

    // 2. If we found and updated a document, insert its old version
    if (oldDoc) {
      const { _id, ...doc } = oldDoc;
      await this.collection.insertOne(
        {
          ...doc,
          _cursor: {
            ...oldDoc._cursor,
            to: Number(this.endCursor?.orderKey),
          },
        } as unknown as OptionalUnlessRequiredId<TSchema>,
        { session: this.session },
      );
    }

    // 3. Return an UpdateResult-compatible object
    return {
      acknowledged: true,
      modifiedCount: oldDoc ? 1 : 0,
      upsertedId: null,
      upsertedCount: 0,
      matchedCount: oldDoc ? 1 : 0,
    };
  }

  async updateMany(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options?: UpdateOptions,
  ): Promise<UpdateResult<TSchema>> {
    // 1. Find all documents matching the filter that are latest (to: null)
    const oldDocs = await this.collection
      .find(
        {
          ...filter,
          "_cursor.to": null,
        },
        { session: this.session },
      )
      .toArray();

    // 2. Update to the new values with updateMany
    // (setting _cursor.from to endCursor, leaving _cursor.to unchanged)
    const updateResult = await this.collection.updateMany(
      {
        ...filter,
        "_cursor.to": null,
      },
      {
        ...update,
        $set: {
          ...update.$set,
          "_cursor.from": Number(this.endCursor?.orderKey),
        } as unknown as MatchKeysAndValues<TSchema>,
      },
      { ...options, session: this.session },
    );

    // 3. Adjust the cursor.to of the old values
    const oldDocsWithUpdatedCursor = oldDocs.map(({ _id, ...doc }) => ({
      ...doc,
      _cursor: {
        ...doc._cursor,
        to: Number(this.endCursor?.orderKey),
      },
    }));

    // 4. Insert the old values back into the db
    if (oldDocsWithUpdatedCursor.length > 0) {
      await this.collection.insertMany(
        oldDocsWithUpdatedCursor as unknown as OptionalUnlessRequiredId<TSchema>[],
        { session: this.session },
      );
    }

    return updateResult;
  }

  async deleteOne(
    filter: Filter<TSchema>,
    options?: DeleteOptions,
  ): Promise<UpdateResult<TSchema>> {
    return await this.collection.updateOne(
      {
        ...filter,
        "_cursor.to": null,
      },
      {
        $set: {
          "_cursor.to": Number(this.endCursor?.orderKey),
        } as unknown as MatchKeysAndValues<TSchema>,
      },
      { ...options, session: this.session },
    );
  }

  async deleteMany(
    filter?: Filter<TSchema>,
    options?: DeleteOptions,
  ): Promise<UpdateResult<TSchema>> {
    return await this.collection.updateMany(
      {
        ...((filter ?? {}) as Filter<TSchema>),
        "_cursor.to": null,
      },
      {
        $set: {
          "_cursor.to": Number(this.endCursor?.orderKey),
        } as unknown as MatchKeysAndValues<TSchema>,
      },
      { ...options, session: this.session },
    );
  }

  async findOne(
    filter: Filter<TSchema>,
    options?: Omit<FindOptions, "timeoutMode">,
  ): Promise<WithId<TSchema> | null> {
    return await this.collection.findOne(
      {
        ...filter,
        "_cursor.to": null,
      },
      { ...options, session: this.session },
    );
  }

  find(
    filter: Filter<TSchema>,
    options?: FindOptions,
  ): FindCursor<WithId<TSchema>> {
    return this.collection.find(
      {
        ...filter,
        "_cursor.to": null,
      },
      { ...options, session: this.session },
    );
  }
}
