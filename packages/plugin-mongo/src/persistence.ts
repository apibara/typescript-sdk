import type { Cursor } from "@apibara/protocol";
import type { ClientSession, Db } from "mongodb";

export type CheckpointSchema = {
  id: string;
  orderKey: number;
  uniqueKey?: `0x${string}`;
};

export type FilterSchema = {
  id: string;
  filter: Record<string, unknown>;
  fromBlock: number;
  toBlock: number | null;
};

export const checkpointCollectionName = "checkpoints";
export const filterCollectionName = "filters";

export async function initializePersistentState(
  db: Db,
  session: ClientSession,
) {
  const checkpoint = await db.createCollection<CheckpointSchema>(
    checkpointCollectionName,
    { session },
  );
  const filter = await db.createCollection<FilterSchema>(filterCollectionName, {
    session,
  });

  await checkpoint.createIndex({ id: 1 }, { session });
  await filter.createIndex({ id: 1, fromBlock: 1 }, { session });
}

export async function persistState<TFilter>(props: {
  db: Db;
  session: ClientSession;
  endCursor: Cursor;
  filter?: TFilter;
  indexerName?: string;
}) {
  const { db, session, endCursor, filter, indexerName = "default" } = props;

  const mongoPersistence = new MongoPersistence<TFilter>(
    db,
    session,
    indexerName,
  );

  await mongoPersistence.put({ cursor: endCursor, filter });
}

export async function getState<TFilter>(props: {
  db: Db;
  session: ClientSession;
  indexerName?: string;
}) {
  const { db, session, indexerName = "default" } = props;
  const mongoPersistence = new MongoPersistence<TFilter>(
    db,
    session,
    indexerName,
  );
  return await mongoPersistence.get();
}

export async function invalidateState<TFilter>(props: {
  db: Db;
  session: ClientSession;
  cursor: Cursor;
  indexerName?: string;
}) {
  const { db, session, cursor, indexerName = "default" } = props;

  const mongoPersistence = new MongoPersistence<TFilter>(
    db,
    session,
    indexerName,
  );

  await mongoPersistence.invalidate(cursor);
}

export async function finalizeState<TFilter>(props: {
  db: Db;
  session: ClientSession;
  cursor: Cursor;
  indexerName?: string;
}) {
  const { db, session, cursor, indexerName = "default" } = props;

  const mongoPersistence = new MongoPersistence<TFilter>(
    db,
    session,
    indexerName,
  );

  await mongoPersistence.finalize(cursor);
}

export class MongoPersistence<TFilter> {
  constructor(
    private db: Db,
    private session: ClientSession,
    private indexerName = "default",
  ) {}

  public async get(): Promise<{ cursor?: Cursor; filter?: TFilter }> {
    const cursor = await this._getCheckpoint();
    const filter = await this._getFilter();

    return { cursor, filter };
  }

  public async put({ cursor, filter }: { cursor?: Cursor; filter?: TFilter }) {
    if (cursor) {
      await this._putCheckpoint(cursor);

      if (filter) {
        await this._putFilter(filter, cursor);
      }
    }
  }

  public async finalize(cursor: Cursor) {
    await this._finalizeFilter(cursor);
  }

  public async invalidate(cursor: Cursor) {
    await this._invalidateFilter(cursor);
  }

  // --- CHECKPOINTS METHODS ---

  private async _getCheckpoint(): Promise<Cursor | undefined> {
    const checkpoint = await this.db
      .collection<CheckpointSchema>(checkpointCollectionName)
      .findOne({ id: this.indexerName }, { session: this.session });

    if (!checkpoint) return undefined;

    return {
      orderKey: BigInt(checkpoint.orderKey),
      uniqueKey: checkpoint.uniqueKey,
    };
  }

  private async _putCheckpoint(cursor: Cursor) {
    await this.db
      .collection<CheckpointSchema>(checkpointCollectionName)
      .updateOne(
        { id: this.indexerName },
        {
          $set: {
            orderKey: Number(cursor.orderKey),
            uniqueKey: cursor.uniqueKey,
          },
        },
        { upsert: true, session: this.session },
      );
  }

  // --- FILTERS METHODS ---

  private async _getFilter(): Promise<TFilter | undefined> {
    const filter = await this.db
      .collection<FilterSchema>(filterCollectionName)
      .findOne(
        {
          id: this.indexerName,
          toBlock: null,
        },
        { session: this.session },
      );

    if (!filter) return undefined;

    return filter.filter as TFilter;
  }

  private async _putFilter(filter: TFilter, endCursor: Cursor) {
    // Update existing filter's to_block
    await this.db
      .collection<FilterSchema>(filterCollectionName)
      .updateMany(
        { id: this.indexerName, toBlock: null },
        { $set: { toBlock: Number(endCursor.orderKey) } },
        { session: this.session },
      );

    // Insert new filter
    await this.db.collection<FilterSchema>(filterCollectionName).updateOne(
      {
        id: this.indexerName,
        fromBlock: Number(endCursor.orderKey),
      },
      {
        $set: {
          filter: filter as Record<string, unknown>,
          fromBlock: Number(endCursor.orderKey),
          toBlock: null,
        },
      },
      { upsert: true, session: this.session },
    );
  }

  private async _invalidateFilter(cursor: Cursor) {
    await this.db
      .collection<FilterSchema>(filterCollectionName)
      .deleteMany(
        { id: this.indexerName, fromBlock: { $gt: Number(cursor.orderKey) } },
        { session: this.session },
      );

    await this.db
      .collection<FilterSchema>(filterCollectionName)
      .updateMany(
        { id: this.indexerName, toBlock: { $gt: Number(cursor.orderKey) } },
        { $set: { toBlock: null } },
        { session: this.session },
      );
  }

  private async _finalizeFilter(cursor: Cursor) {
    await this.db.collection<FilterSchema>(filterCollectionName).deleteMany(
      {
        id: this.indexerName,
        toBlock: { $lt: Number(cursor.orderKey) },
      },
      { session: this.session },
    );
  }
}
