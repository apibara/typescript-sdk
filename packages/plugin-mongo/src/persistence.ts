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

  if (endCursor) {
    await db.collection<CheckpointSchema>(checkpointCollectionName).updateOne(
      { id: indexerName },
      {
        $set: {
          orderKey: Number(endCursor.orderKey),
          uniqueKey: endCursor.uniqueKey,
        },
      },
      { upsert: true, session },
    );

    if (filter) {
      // Update existing filter's to_block
      await db
        .collection<FilterSchema>(filterCollectionName)
        .updateMany(
          { id: indexerName, toBlock: null },
          { $set: { toBlock: Number(endCursor.orderKey) } },
          { session },
        );

      // Insert new filter
      await db.collection<FilterSchema>(filterCollectionName).updateOne(
        {
          id: indexerName,
          fromBlock: Number(endCursor.orderKey),
        },
        {
          $set: {
            filter: filter as Record<string, unknown>,
            fromBlock: Number(endCursor.orderKey),
            toBlock: null,
          },
        },
        { upsert: true, session },
      );
    }
  }
}

export async function getState<TFilter>(props: {
  db: Db;
  session: ClientSession;
  indexerName?: string;
}): Promise<{ cursor?: Cursor; filter?: TFilter }> {
  const { db, session, indexerName = "default" } = props;

  let cursor: Cursor | undefined;
  let filter: TFilter | undefined;

  const checkpointRow = await db
    .collection<CheckpointSchema>(checkpointCollectionName)
    .findOne({ id: indexerName }, { session });

  if (checkpointRow) {
    cursor = {
      orderKey: BigInt(checkpointRow.orderKey),
      uniqueKey: checkpointRow.uniqueKey,
    };
  }

  const filterRow = await db
    .collection<FilterSchema>(filterCollectionName)
    .findOne(
      {
        id: indexerName,
        toBlock: null,
      },
      { session },
    );

  if (filterRow) {
    filter = filterRow.filter as TFilter;
  }

  return { cursor, filter };
}

export async function invalidateState(props: {
  db: Db;
  session: ClientSession;
  cursor: Cursor;
  indexerName?: string;
}) {
  const { db, session, cursor, indexerName = "default" } = props;

  await db
    .collection<FilterSchema>(filterCollectionName)
    .deleteMany(
      { id: indexerName, fromBlock: { $gt: Number(cursor.orderKey) } },
      { session },
    );

  await db
    .collection<FilterSchema>(filterCollectionName)
    .updateMany(
      { id: indexerName, toBlock: { $gt: Number(cursor.orderKey) } },
      { $set: { toBlock: null } },
      { session },
    );
}

export async function finalizeState(props: {
  db: Db;
  session: ClientSession;
  cursor: Cursor;
  indexerName?: string;
}) {
  const { db, session, cursor, indexerName = "default" } = props;

  await db.collection<FilterSchema>(filterCollectionName).deleteMany(
    {
      id: indexerName,
      toBlock: { $lt: Number(cursor.orderKey) },
    },
    { session },
  );
}
