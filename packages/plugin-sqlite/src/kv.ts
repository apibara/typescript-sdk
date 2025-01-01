import type { Cursor, DataFinality } from "@apibara/protocol";
import type { Database } from "better-sqlite3";

import {
  type DeserializeFn,
  type SerializeFn,
  assertInTransaction,
} from "./utils";

export function initializeKeyValueStore(db: Database) {
  assertInTransaction(db);
  db.exec(statements.createTable);
}

export class KeyValueStore {
  constructor(
    private readonly db: Database,
    private readonly endCursor: Cursor,
    private readonly finality: DataFinality,
    private readonly serialize: SerializeFn,
    private readonly deserialize: DeserializeFn,
  ) {
    assertInTransaction(db);
  }

  get<T>(key: string): T | undefined {
    const row = this.db.prepare<string, KeyValueRow>(statements.get).get(key);

    return row ? this.deserialize(row.v) : undefined;
  }

  put<T>(key: string, value: T) {
    this.db
      .prepare<[number, string], KeyValueRow>(statements.updateToBlock)
      .run(Number(this.endCursor.orderKey), key);

    this.db
      .prepare<[number, string, string], KeyValueRow>(statements.insertIntoKvs)
      .run(
        Number(this.endCursor.orderKey),
        key,
        this.serialize(value as Record<string, unknown>),
      );
  }

  del(key: string) {
    this.db
      .prepare<[number, string], KeyValueRow>(statements.del)
      .run(Number(this.endCursor.orderKey), key);
  }
}

export function finalizeKV(db: Database, cursor: Cursor) {
  assertInTransaction(db);

  db.prepare<[number], KeyValueRow>(statements.finalize).run(
    Number(cursor.orderKey),
  );
}

export function invalidateKV(db: Database, cursor: Cursor) {
  assertInTransaction(db);

  // Delete entries that started after the invalidation cursor
  db.prepare<[number], KeyValueRow>(statements.invalidateDelete).run(
    Number(cursor.orderKey),
  );

  // Update entries that were supposed to end after the invalidation cursor
  db.prepare<[number], KeyValueRow>(statements.invalidateUpdate).run(
    Number(cursor.orderKey),
  );
}

type KeyValueRow = {
  from_block: number;
  to_block: number;
  k: string;
  v: string;
};

const statements = {
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
  finalize: `
    DELETE FROM kvs
    WHERE to_block <= ?`,
  invalidateDelete: `
    DELETE FROM kvs
    WHERE from_block > ?`,
  invalidateUpdate: `
    UPDATE kvs
    SET to_block = NULL
    WHERE to_block > ?`,
};
