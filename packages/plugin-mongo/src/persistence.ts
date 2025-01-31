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
  indexerId: string;
}) {
  const { db, session, endCursor, filter, indexerId } = props;

  if (endCursor) {
    await db.collection<CheckpointSchema>(checkpointCollectionName).updateOne(
      { id: indexerId },
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
          { id: indexerId, toBlock: null },
          { $set: { toBlock: Number(endCursor.orderKey) } },
          { session },
        );

      // Insert new filter
      await db.collection<FilterSchema>(filterCollectionName).updateOne(
        {
          id: indexerId,
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
  indexerId: string;
}): Promise<{ cursor?: Cursor; filter?: TFilter }> {
  const { db, session, indexerId } = props;

  let cursor: Cursor | undefined;
  let filter: TFilter | undefined;

  const checkpointRow = await db
    .collection<CheckpointSchema>(checkpointCollectionName)
    .findOne({ id: indexerId }, { session });

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
        id: indexerId,
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
  indexerId: string;
}) {
  const { db, session, cursor, indexerId } = props;

  await db
    .collection<FilterSchema>(filterCollectionName)
    .deleteMany(
      { id: indexerId, fromBlock: { $gt: Number(cursor.orderKey) } },
      { session },
    );

  await db
    .collection<FilterSchema>(filterCollectionName)
    .updateMany(
      { id: indexerId, toBlock: { $gt: Number(cursor.orderKey) } },
      { $set: { toBlock: null } },
      { session },
    );
}

export async function finalizeState(props: {
  db: Db;
  session: ClientSession;
  cursor: Cursor;
  indexerId: string;
}) {
  const { db, session, cursor, indexerId } = props;

  await db.collection<FilterSchema>(filterCollectionName).deleteMany(
    {
      id: indexerId,
      toBlock: { $lte: Number(cursor.orderKey) },
    },
    { session },
  );
}
