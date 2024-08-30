import assert from "node:assert";
import type { Cursor, DataFinality } from "@apibara/protocol";
import type { Database as SqliteDatabase, Statement } from "better-sqlite3";
import { useIndexerContext } from "../context";
import { deserialize, serialize } from "../vcr";
import { defineIndexerPlugin } from "./config";

export function kv<TFilter, TBlock, TTxnParams>({
  database,
}: { database: SqliteDatabase }) {
  return defineIndexerPlugin<TFilter, TBlock, TTxnParams>((indexer) => {
    indexer.hooks.hook("run:before", () => {
      KVStore.initialize(database);
    });

    indexer.hooks.hook("handler:before", ({ finality, endCursor }) => {
      const ctx = useIndexerContext();

      assert(endCursor, new Error("endCursor cannot be undefined"));

      ctx.kv = new KVStore(database, finality, endCursor);

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
  });
}

export class KVStore {
  /** Sqlite Queries Prepare Statements */
  private _beginTxnQuery: Statement;
  private _commitTxnQuery: Statement;
  private _rollbackTxnQuery: Statement;
  private _getQuery: Statement<string, { v: string }>;
  private _updateToBlockQuery: Statement<[number, string]>;
  private _insertIntoKvsQuery: Statement<[number, string, string]>;
  private _delQuery: Statement<[number, string]>;

  constructor(
    private _db: SqliteDatabase,
    private _finality: DataFinality,
    private _endCursor: Cursor,
  ) {
    this._beginTxnQuery = this._db.prepare(statements.beginTxn);
    this._commitTxnQuery = this._db.prepare(statements.commitTxn);
    this._rollbackTxnQuery = this._db.prepare(statements.rollbackTxn);
    this._getQuery = this._db.prepare(statements.get);
    this._updateToBlockQuery = this._db.prepare(statements.updateToBlock);
    this._insertIntoKvsQuery = this._db.prepare(statements.insertIntoKvs);
    this._delQuery = this._db.prepare(statements.del);
  }

  static initialize(db: SqliteDatabase) {
    db.prepare(statements.createTable).run();
  }

  beginTransaction() {
    this._beginTxnQuery.run();
  }

  commitTransaction() {
    this._commitTxnQuery.run();
  }

  rollbackTransaction() {
    this._rollbackTxnQuery.run();
  }

  get<T>(key: string): T {
    const row = this._getQuery.get(key);

    return row ? deserialize(row.v) : undefined;
  }

  put<T>(key: string, value: T) {
    this._updateToBlockQuery.run(Number(this._endCursor.orderKey), key);

    this._insertIntoKvsQuery.run(
      Number(this._endCursor.orderKey),
      key,
      serialize(value as Record<string, unknown>),
    );
  }

  del(key: string) {
    this._delQuery.run(Number(this._endCursor.orderKey), key);
  }
}

const statements = {
  beginTxn: "BEGIN TRANSACTION",
  commitTxn: "COMMIT TRANSACTION",
  rollbackTxn: "ROLLBACK TRANSACTION",
  createTable: `
    CREATE TABLE IF NOT EXISTS kvs (
      from_block INTEGER NOT NULL,
      to_block INTEGER,
      k TEXT NOT NULL,
      v BLOB NOT NULL,
      PRIMARY KEY (from_block, k)
      );`,
  get: `
    SELECT v
    FROM kvs
    WHERE k = ? AND to_block IS NULL`,
  updateToBlock: `
    UPDATE kvs
    SET to_block = ?
    WHERE k = ? AND to_block IS NULL`,
  insertIntoKvs: `
    INSERT INTO kvs (from_block, to_block, k, v)
    VALUES (?, NULL, ?, ?)`,
  del: `
    UPDATE kvs
    SET to_block = ?
    WHERE k = ? AND to_block IS NULL`,
};
