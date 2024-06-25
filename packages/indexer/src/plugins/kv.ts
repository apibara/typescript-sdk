import assert from "node:assert";
import type { Cursor, DataFinality } from "@apibara/protocol";
import { type Database, type ISqlite, open } from "sqlite";
import { useIndexerContext } from "../context";
import { deserialize, serialize } from "../vcr";
import { defineIndexerPlugin } from "./config";

type SqliteArgs = ISqlite.Config;

export function kv<TFilter, TBlock, TRet>(args: SqliteArgs) {
  return defineIndexerPlugin<TFilter, TBlock, TRet>((indexer) => {
    let db: Database;

    indexer.hooks.hook("run:before", async () => {
      db = await open(args);
      await db.exec(`
        CREATE TABLE IF NOT EXISTS kvs (
          from_block INTEGER NOT NULL,
          to_block INTEGER,
          k TEXT NOT NULL,
          v BLOB NOT NULL,
          PRIMARY KEY (from_block, k)
        );
      `);
    });

    indexer.hooks.hook("handler:before", async ({ finality, endCursor }) => {
      const ctx = useIndexerContext();

      assert(endCursor, new Error("endCursor cannot be undefined"));

      ctx.kv = new KVStore(db, finality, endCursor);

      await db.exec("BEGIN TRANSACTION");
    });

    indexer.hooks.hook("handler:after", async () => {
      await db.exec("COMMIT TRANSACTION");

      const ctx = useIndexerContext();

      ctx.kv = null;
    });

    indexer.hooks.hook("handler:exception", async () => {
      await db.exec("ROLLBACK TRANSACTION");

      const ctx = useIndexerContext();

      ctx.kv = null;
    });

    indexer.hooks.hook("run:after", async () => {
      console.log("kv: ", useIndexerContext().kv);
    });
  });
}

export class KVStore {
  constructor(
    private _db: Database,
    private _finality: DataFinality,
    private _endCursor: Cursor,
  ) {}

  async get<T>(key: string): Promise<T> {
    const row = await this._db.get<{ v: string }>(
      `
      SELECT v
      FROM kvs
      WHERE k = ? AND to_block IS NULL
    `,
      [key],
    );

    return row ? deserialize(row.v) : undefined;
  }

  async put<T>(key: string, value: T) {
    await this._db.run(
      `
      UPDATE kvs
      SET to_block = ?
      WHERE k = ? AND to_block IS NULL
    `,
      [Number(this._endCursor.orderKey), key],
    );

    await this._db.run(
      `
      INSERT INTO kvs (from_block, to_block, k, v)
      VALUES (?, NULL, ?, ?)
    `,
      [
        Number(this._endCursor.orderKey),
        key,
        serialize(value as Record<string, unknown>),
      ],
    );
  }

  async del(key: string) {
    await this._db.run(
      `
      UPDATE kvs
      SET to_block = ?
      WHERE k = ? AND to_block IS NULL
    `,
      [Number(this._endCursor.orderKey), key],
    );
  }
}
