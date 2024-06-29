import type { Cursor } from "@apibara/protocol";
import { type Database, type ISqlite, open } from "sqlite";
import { defineIndexerPlugin } from "./config";

type SqliteArgs = ISqlite.Config;

export function sqlitePersistence<TFilter, TBlock, TRet>(args: SqliteArgs) {
  return defineIndexerPlugin<TFilter, TBlock, TRet>((indexer) => {
    let db: Database;

    indexer.hooks.hook("run:before", async () => {
      db = await open(args);
      await SqlitePersistence.initialize(db);
    });

    indexer.hooks.hook("connect:before", async ({ request }) => {
      const store = new SqlitePersistence(db);

      const lastCursor = await store.get();

      if (lastCursor) {
        request.startingCursor = lastCursor;
      }
    });

    indexer.hooks.hook("sink:flush", async ({ endCursor }) => {
      const store = new SqlitePersistence(db);
      if (endCursor) store.put(endCursor);
    });
  });
}

export class SqlitePersistence {
  constructor(private _db: Database) {}

  static async initialize(db: Database) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS checkpoints (
        id TEXT NOT NULL PRIMARY KEY,
        order_key INTEGER NOT NULL,
        unique_key TEXT,
        PRIMARY KEY (order_key, unique_key)
      );
    `);
  }
  async get(): Promise<Cursor | undefined> {
    const row = await this._db.get<CheckpointRow>(
      `
      SELECT *
      FROM checkpoints
      WHERE id = ?
    `,
      ["default"],
    );

    if (!row) return undefined;

    return { orderKey: BigInt(row.order_key), uniqueKey: row.unique_key };
  }

  async put(cursor: Cursor) {
    await this._db.run(
      `
      INSERT INTO checkpoints (id, order_key, unique_key)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
      order_key = excluded.order_key,
      unique_key = excluded.unique_key
    `,
      ["default", Number(cursor.orderKey), cursor.uniqueKey],
    );
  }

  async del() {
    await this._db.run(
      `
      DELETE FROM checkpoints
      WHERE id = ?
    `,
      ["default"],
    );
  }
}

export type CheckpointRow = {
  id: string;
  order_key: number;
  unique_key?: `0x${string}`;
};
