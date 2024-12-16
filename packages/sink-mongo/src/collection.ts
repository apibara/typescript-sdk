import type { Cursor } from "@apibara/protocol";
import type {
  BulkWriteOptions,
  ClientSession,
  Collection,
  Condition,
  DeleteOptions,
  Document,
  Filter,
  FindCursor,
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

export type MongoCursor = {
  from: number | null;
  to: number | null;
};

export type CursoredSchema<TSchema extends Document> = TSchema & {
  _cursor: MongoCursor;
};

export class MongoSinkCollection<TSchema extends Document> {
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
    return await this.collection.updateOne(
      {
        ...filter,
        _cursor: {
          to: null,
        } as Condition<MongoCursor | null>,
      },
      {
        ...update,
        $set: {
          ...update.$set,
          "_cursor.to": Number(this.endCursor?.orderKey),
        } as unknown as MatchKeysAndValues<TSchema>,
      },
      { ...options, session: this.session },
    );
  }

  async updateMany(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options?: UpdateOptions,
  ): Promise<UpdateResult<TSchema>> {
    return await this.collection.updateMany(
      {
        ...filter,
        _cursor: { to: null },
      },
      {
        ...update,
        $set: {
          ...update.$set,
          "_cursor.to": Number(this.endCursor?.orderKey),
        } as unknown as MatchKeysAndValues<TSchema>,
      },
      { ...options, session: this.session },
    );
  }

  async deleteOne(
    filter?: Filter<TSchema>,
    options?: DeleteOptions,
  ): Promise<UpdateResult<TSchema>> {
    return await this.collection.updateOne(
      {
        ...((filter ?? {}) as Filter<TSchema>),
        _cursor: {
          to: null,
        } as Condition<MongoCursor | null>,
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
        _cursor: {
          to: null,
        } as Condition<MongoCursor | null>,
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
    options: Omit<FindOptions, "timeoutMode">,
  ): Promise<WithId<TSchema> | null> {
    return await this.collection.findOne(
      {
        ...filter,
        _cursor: {
          to: null,
        } as Condition<MongoCursor | null>,
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
        _cursor: {
          to: null,
        } as Condition<MongoCursor | null>,
      },
      { ...options, session: this.session },
    );
  }
}
