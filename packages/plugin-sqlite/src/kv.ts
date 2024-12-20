/*
import { isCursor, type Cursor, type DataFinality } from "@apibara/protocol";
import { defineIndexerPlugin } from "@apibara/indexer/plugins";
import type { Database as SqliteDatabase, Statement } from "better-sqlite3";

export function kv<TFilter, TBlock>({
  database,
}: { database: SqliteDatabase }) {
  return defineIndexerPlugin<TFilter, TBlock>((indexer) => {
    indexer.hooks.hook("run:before", () => {
      KVStore.initialize(database);
    });

    indexer.hooks.hook("handler:middleware", ({ use }) => {
      use(async (ctx, next) => {
        if (!ctx.finality) {
          throw new Error("finality is undefined");
        }

        if (!ctx.endCursor || !isCursor(ctx.endCursor)) {
          throw new Error("endCursor is undefined or not a cursor");
        }

        ctx.kv = new KVStore(database, ctx.finality, ctx.endCursor);
        ctx.kv.beginTransaction();

        try {
          await next();
        } catch (error) {
          ctx.kv.rollbackTransaction();
          ctx.kv = null;
          throw error;
        }

        ctx.kv.commitTransaction();
        ctx.kv = null;
      });
    });
  });
}

export class KVStore {
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

export type UseKVStoreResult = InstanceType<typeof KVStore>;

export function useKVStore(): UseKVStoreResult {
  const ctx = useIndexerContext();

  if (!ctx?.kv) throw new Error("KV Plugin is not available in context!");

  return ctx.kv;
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

*/
