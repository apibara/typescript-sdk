import type { Cursor } from "@apibara/protocol";
import type { ClientSession, Db } from "mongodb";

export async function invalidate(
  db: Db,
  session: ClientSession,
  cursor: Cursor,
  collections: string[],
) {
  const orderKeyValue = Number(cursor.orderKey);
  for (const collection of collections) {
    // Delete documents where the lower bound of _cursor is greater than the invalidate cursor
    await db.collection(collection).deleteMany(
      {
        "_cursor.from": {
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
}

export async function finalize(
  db: Db,
  session: ClientSession,
  cursor: Cursor,
  collections: string[],
) {
  const orderKeyValue = Number(cursor.orderKey);
  for (const collection of collections) {
    // Delete documents where the upper bound of _cursor is less than the finalize cursor
    await db.collection(collection).deleteMany(
      {
        "_cursor.to": { $lt: orderKeyValue },
      },
      { session },
    );
  }
}
