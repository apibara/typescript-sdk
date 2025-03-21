import { type Cursor, normalizeCursor } from "@apibara/protocol";
import type { Database } from "better-sqlite3";

import { assertInTransaction, deserialize, serialize } from "./utils";

export function initializePersistentState(db: Database) {
  assertInTransaction(db);
  db.exec(statements.createCheckpointsTable);
  db.exec(statements.createFiltersTable);
}

export function persistState<TFilter>(props: {
  db: Database;
  endCursor: Cursor;
  filter?: TFilter;
  indexerId: string;
}) {
  const { db, endCursor, filter, indexerId } = props;

  assertInTransaction(db);

  db.prepare(statements.putCheckpoint).run(
    indexerId,
    Number(endCursor.orderKey),
    endCursor.uniqueKey,
  );

  if (filter) {
    db.prepare(statements.updateFilterToBlock).run(
      Number(endCursor.orderKey),
      indexerId,
    );
    db.prepare(statements.insertFilter).run(
      indexerId,
      serialize(filter as Record<string, unknown>),
      Number(endCursor.orderKey),
    );
  }
}

export function getState<TFilter>(props: {
  db: Database;
  indexerId: string;
}) {
  const { db, indexerId } = props;
  assertInTransaction(db);
  const storedCursor = db
    .prepare<string, { order_key?: number; unique_key?: string }>(
      statements.getCheckpoint,
    )
    .get(indexerId);
  const storedFilter = db
    .prepare<string, { filter: string }>(statements.getFilter)
    .get(indexerId);

  let cursor: Cursor | undefined;
  let filter: TFilter | undefined;

  if (storedCursor?.order_key) {
    cursor = normalizeCursor({
      orderKey: BigInt(storedCursor.order_key),
      uniqueKey: storedCursor.unique_key ? storedCursor.unique_key : null,
    });
  }

  if (storedFilter) {
    filter = deserialize(storedFilter.filter) as TFilter;
  }

  return { cursor, filter };
}

export function finalizeState(props: {
  db: Database;
  cursor: Cursor;
  indexerId: string;
}) {
  const { cursor, db, indexerId } = props;
  assertInTransaction(db);
  db.prepare<[string, number]>(statements.finalizeFilter).run(
    indexerId,
    Number(cursor.orderKey),
  );
}

export function invalidateState(props: {
  db: Database;
  cursor: Cursor;
  indexerId: string;
}) {
  const { cursor, db, indexerId } = props;
  assertInTransaction(db);
  db.prepare<[string, number]>(statements.invalidateFilterDelete).run(
    indexerId,
    Number(cursor.orderKey),
  );
  db.prepare<[string, number]>(statements.invalidateFilterUpdate).run(
    indexerId,
    Number(cursor.orderKey),
  );
}

export function resetPersistence(props: {
  db: Database;
  indexerId: string;
}) {
  const { db, indexerId } = props;
  assertInTransaction(db);
  db.prepare<[string]>(statements.resetCheckpoint).run(indexerId);
  db.prepare<[string]>(statements.resetFilter).run(indexerId);
}

export type CheckpointRow = {
  id: string;
  order_key: number;
  unique_key: string | null;
};

export type FilterRow = {
  id: string;
  filter: string;
  from_block: number;
  to_block: number | null;
};

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
    WHERE id = ? AND to_block <= ?`,
  invalidateFilterDelete: `
    DELETE FROM filters
    WHERE id = ? AND from_block > ?`,
  invalidateFilterUpdate: `
    UPDATE filters
    SET to_block = NULL
    WHERE id = ? AND to_block > ?`,
  resetCheckpoint: `
    DELETE FROM checkpoints
    WHERE id = ?`,
  resetFilter: `
    DELETE FROM filters
    WHERE id = ?`,
};
