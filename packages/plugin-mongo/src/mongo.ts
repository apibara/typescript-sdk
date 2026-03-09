import type { Cursor } from "@apibara/protocol";
import type { ClientSession, Db } from "mongodb";

export async function invalidate(
  db: Db,
  session: ClientSession,
  cursor: Cursor,
  collections: string[],
) {
  for (const collection of collections) {
    // Delete documents where the lower bound of _cursor is greater than the invalidate cursor
    await db.collection(collection).deleteMany(
      {
        "_cursor.from": {
          $gt: cursor.orderKey,
        },
      },
      { session },
    );

    // Update documents where the upper bound of _cursor is greater than the invalidate cursor
    await db.collection(collection).updateMany(
      { "_cursor.to": { $gt: cursor.orderKey } },
      {
        $set: {
          "_cursor.to": null,
        },
      },
      { session },
    );
  }
}

export async function finalize(
  db: Db,
  session: ClientSession,
  cursor: Cursor,
  collections: string[],
) {
  for (const collection of collections) {
    // Delete documents where the upper bound of _cursor is less than the finalize cursor
    await db.collection(collection).deleteMany(
      {
        "_cursor.to": { $lte: cursor.orderKey },
      },
      { session },
    );
  }
}

export async function cleanupStorage(
  db: Db,
  session: ClientSession,
  collections: string[],
) {
  for (const collection of collections) {
    try {
      // Delete all documents in the collection
      await db.collection(collection).deleteMany({}, { session });
    } catch (error) {
      throw new Error(`Failed to clean up collection ${collection}`, {
        cause: error,
      });
    }
  }
}
