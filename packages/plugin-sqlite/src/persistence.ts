import type { Cursor } from "@apibara/protocol";
import type { Database } from "better-sqlite3";

import { assertInTransaction, deserialize, serialize } from "./utils";

const DEFAULT_INDEXER_ID = "default";

export function initializePersistentState(db: Database) {
  assertInTransaction(db);
  db.exec(statements.createCheckpointsTable);
  db.exec(statements.createFiltersTable);
}

export function persistState<TFilter>(
  db: Database,
  endCursor: Cursor,
  filter?: TFilter,
) {
  assertInTransaction(db);

  db.prepare(statements.putCheckpoint).run(
    DEFAULT_INDEXER_ID,
    Number(endCursor.orderKey),
    endCursor.uniqueKey,
  );

  if (filter) {
    db.prepare(statements.updateFilterToBlock).run(
      Number(endCursor.orderKey),
      DEFAULT_INDEXER_ID,
    );
    db.prepare(statements.insertFilter).run(
      DEFAULT_INDEXER_ID,
      serialize(filter as Record<string, unknown>),
      Number(endCursor.orderKey),
    );
  }
}

export function getState<TFilter>(db: Database) {
  assertInTransaction(db);
  const storedCursor = db
    .prepare<string, { order_key?: number; unique_key?: string }>(
      statements.getCheckpoint,
    )
    .get(DEFAULT_INDEXER_ID);
  const storedFilter = db
    .prepare<string, { filter: string }>(statements.getFilter)
    .get(DEFAULT_INDEXER_ID);

  let cursor: Cursor | undefined;
  let filter: TFilter | undefined;

  if (storedCursor?.order_key) {
    cursor = {
      orderKey: BigInt(storedCursor.order_key),
      uniqueKey: storedCursor.unique_key as `0x${string}`,
    };
  }

  if (storedFilter) {
    filter = deserialize(storedFilter.filter) as TFilter;
  }

  return { cursor, filter };
}

export function finalizeState(db: Database, cursor: Cursor) {
  db.prepare<[string, number]>(statements.finalizeFilter).run(
    DEFAULT_INDEXER_ID,
    Number(cursor.orderKey),
  );
}

const statements = {
  createCheckpointsTable: `
    CREATE TABLE IF NOT EXISTS checkpoints (
      id TEXT NOT NULL PRIMARY KEY,
      order_key INTEGER,
      unique_key TEXT
    );`,
  createFiltersTable: `
    CREATE TABLE IF NOT EXISTS filters (
      id TEXT NOT NULL,
      filter BLOB NOT NULL,
      from_block INTEGER NOT NULL,
      to_block INTEGER,
      PRIMARY KEY (id, from_block)
    );`,
  getCheckpoint: `
    SELECT *
    FROM checkpoints
    WHERE id = ?`,
  putCheckpoint: `
    INSERT INTO checkpoints (id, order_key, unique_key)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      order_key = excluded.order_key,
      unique_key = excluded.unique_key`,
  delCheckpoint: `
    DELETE FROM checkpoints
    WHERE id = ?`,
  getFilter: `
    SELECT *
    FROM filters
    WHERE id = ? AND to_block IS NULL`,
  updateFilterToBlock: `
    UPDATE filters
    SET to_block = ?
    WHERE id = ? AND to_block IS NULL`,
  insertFilter: `
    INSERT INTO filters (id, filter, from_block)
    VALUES (?, ?, ?)
    ON CONFLICT(id, from_block) DO UPDATE SET
      filter = excluded.filter,
      from_block = excluded.from_block`,
  delFilter: `
    DELETE FROM filters
    WHERE id = ?`,
  finalizeFilter: `
    DELETE FROM filters
    WHERE id = ? AND to_block < ?`,
};
