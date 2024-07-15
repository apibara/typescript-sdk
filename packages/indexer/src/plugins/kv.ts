import assert from "node:assert";
import type { Cursor, DataFinality } from "@apibara/protocol";
import Database, { type Database as SqliteDatabase } from "better-sqlite3";
import { useIndexerContext } from "../context";
import { deserialize, serialize } from "../vcr";
import { defineIndexerPlugin } from "./config";

type SqliteArgs = Database.Options & {
  filename: string | Buffer | undefined;
};

export function kv<TFilter, TBlock, TRet>(args: SqliteArgs) {
  return defineIndexerPlugin<TFilter, TBlock, TRet>((indexer) => {
    let db: SqliteDatabase;

    indexer.hooks.hook("run:before", () => {
      const { filename, ...sqliteOptions } = args;
      db = new Database(filename, sqliteOptions);

      KVStore.initialize(db);
    });

    indexer.hooks.hook("handler:before", ({ finality, endCursor }) => {
      const ctx = useIndexerContext();

      assert(endCursor, new Error("endCursor cannot be undefined"));

      ctx.kv = new KVStore(db, finality, endCursor);

      ctx.kv.beginTransaction();
    });

    indexer.hooks.hook("handler:after", () => {
      const ctx = useIndexerContext();

      ctx.kv.commitTransaction();

      ctx.kv = null;
    });

    indexer.hooks.hook("handler:exception", () => {
      const ctx = useIndexerContext();

      ctx.kv.rollbackTransaction();

      ctx.kv = null;
    });

    indexer.hooks.hook("run:after", () => {
      console.log("kv: ", useIndexerContext().kv);
    });
  });
}

export class KVStore {
  constructor(
    private _db: SqliteDatabase,
    private _finality: DataFinality,
    private _endCursor: Cursor,
  ) {}

  static initialize(db: SqliteDatabase) {
    db.pragma("journal_mode = WAL");

    db.prepare(`
      CREATE TABLE IF NOT EXISTS kvs (
        from_block INTEGER NOT NULL,
        to_block INTEGER,
        k TEXT NOT NULL,
        v BLOB NOT NULL,
        PRIMARY KEY (from_block, k)
      );
    `).run();
  }

  beginTransaction() {
    this._db.prepare("BEGIN TRANSACTION").run();
  }

  commitTransaction() {
    this._db.prepare("COMMIT TRANSACTION").run();
  }

  rollbackTransaction() {
    this._db.prepare("ROLLBACK TRANSACTION").run();
  }

  get<T>(key: string): T {
    const row = this._db
      .prepare<string, { v: string }>(
        `
      SELECT v
      FROM kvs
      WHERE k = ? AND to_block IS NULL`,
      )
      .get(key);

    return row ? deserialize(row.v) : undefined;
  }

  put<T>(key: string, value: T) {
    this._db
      .prepare(
        `
      UPDATE kvs
      SET to_block = ?
      WHERE k = ? AND to_block IS NULL
    `,
      )
      .run(Number(this._endCursor.orderKey), key);

    this._db
      .prepare(
        `
      INSERT INTO kvs (from_block, to_block, k, v)
      VALUES (?, NULL, ?, ?)
    `,
      )
      .run(
        Number(this._endCursor.orderKey),
        key,
        serialize(value as Record<string, unknown>),
      );
  }

  del(key: string) {
    this._db
      .prepare(
        `
      UPDATE kvs
      SET to_block = ?
      WHERE k = ? AND to_block IS NULL
    `,
      )
      .run(Number(this._endCursor.orderKey), key);
  }
}
