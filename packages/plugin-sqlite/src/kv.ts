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
    private readonly indexerId: string,
  ) {
    assertInTransaction(db);
  }

  get<T>(key: string): T | undefined {
    const row = this.db
      .prepare<[string, string], KeyValueRow>(statements.get)
      .get(key, this.indexerId);

    return row ? this.deserialize(row.v) : undefined;
  }

  put<T>(key: string, value: T) {
    this.db
      .prepare<[number, string, string], KeyValueRow>(statements.updateToBlock)
      .run(Number(this.endCursor.orderKey), key, this.indexerId);

    this.db
      .prepare<[number, string, string, string], KeyValueRow>(
        statements.insertIntoKvs,
      )
      .run(
        Number(this.endCursor.orderKey),
        key,
        this.serialize(value as Record<string, unknown>),
        this.indexerId,
      );
  }

  del(key: string) {
    this.db
      .prepare<[number, string, string], KeyValueRow>(statements.del)
      .run(Number(this.endCursor.orderKey), key, this.indexerId);
  }
}

export function finalizeKV(db: Database, cursor: Cursor, indexerId: string) {
  assertInTransaction(db);

  db.prepare<[number, string], KeyValueRow>(statements.finalize).run(
    Number(cursor.orderKey),
    indexerId,
  );
}

export function invalidateKV(db: Database, cursor: Cursor, indexerId: string) {
  assertInTransaction(db);

  // Delete entries that started after the invalidation cursor
  db.prepare<[number, string], KeyValueRow>(statements.invalidateDelete).run(
    Number(cursor.orderKey),
    indexerId,
  );

  // Update entries that were supposed to end after the invalidation cursor
  db.prepare<[number, string], KeyValueRow>(statements.invalidateUpdate).run(
    Number(cursor.orderKey),
    indexerId,
  );
}

export function cleanupKV(db: Database, indexerId: string) {
  assertInTransaction(db);

  db.prepare<[string], KeyValueRow>(statements.cleanup).run(indexerId);
}

export type KeyValueRow = {
  from_block: number;
  to_block: number;
  k: string;
  v: string;
  id: string;
};

const statements = {
  createTable: `
    CREATE TABLE IF NOT EXISTS kvs (
      from_block INTEGER NOT NULL,
      to_block INTEGER,
      k TEXT NOT NULL,
      v BLOB NOT NULL,
      id TEXT NOT NULL,
      PRIMARY KEY (from_block, k, id)
      );`,
  get: `
    SELECT v
    FROM kvs
    WHERE k = ? AND id = ? AND to_block IS NULL`,
  updateToBlock: `
    UPDATE kvs
    SET to_block = ?
    WHERE k = ? AND id = ? AND to_block IS NULL`,
  insertIntoKvs: `
    INSERT INTO kvs (from_block, to_block, k, v, id)
    VALUES (?, NULL, ?, ?, ?)`,
  del: `
    UPDATE kvs
    SET to_block = ?
    WHERE k = ? AND id = ? AND to_block IS NULL`,
  finalize: `
    DELETE FROM kvs
    WHERE to_block <= ? AND id = ?`,
  invalidateDelete: `
    DELETE FROM kvs
    WHERE from_block > ? AND id = ?`,
  invalidateUpdate: `
    UPDATE kvs
    SET to_block = NULL
    WHERE to_block > ? AND id = ?`,
  cleanup: `
    DELETE FROM kvs
    WHERE id = ?`,
} as const;
