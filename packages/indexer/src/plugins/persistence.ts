import type { Cursor } from "@apibara/protocol";
import type { Database as SqliteDatabase, Statement } from "better-sqlite3";
import { deserialize, serialize } from "../vcr";
import { defineIndexerPlugin } from "./config";

export function inMemoryPersistence<TFilter, TBlock, TTxnParams>() {
  return defineIndexerPlugin<TFilter, TBlock, TTxnParams>((indexer) => {
    let lastCursor: Cursor | undefined;
    let lastFilter: TFilter | undefined;

    indexer.hooks.hook("connect:before", ({ request }) => {
      if (lastCursor) {
        request.startingCursor = lastCursor;
      }

      if (lastFilter) {
        request.filter[1] = lastFilter;
      }
    });

    indexer.hooks.hook("transaction:commit", ({ endCursor }) => {
      if (endCursor) {
        lastCursor = endCursor;
      }
    });

    indexer.hooks.hook("connect:factory", ({ request, endCursor }) => {
      if (request.filter[1]) {
        lastCursor = endCursor;
        lastFilter = request.filter[1];
      }
    });
  });
}

export function sqlitePersistence<TFilter, TBlock, TTxnParams>({
  database,
}: { database: SqliteDatabase }) {
  return defineIndexerPlugin<TFilter, TBlock, TTxnParams>((indexer) => {
    let store: SqlitePersistence<TFilter>;

    indexer.hooks.hook("run:before", () => {
      SqlitePersistence.initialize(database);

      store = new SqlitePersistence(database);
    });

    indexer.hooks.hook("connect:before", ({ request }) => {
      const { cursor, filter } = store.get();

      if (cursor) {
        request.startingCursor = cursor;
      }

      if (filter) {
        request.filter[1] = filter;
      }
    });

    indexer.hooks.hook("transaction:commit", ({ endCursor }) => {
      if (endCursor) {
        store.put({ cursor: endCursor });
      }
    });

    indexer.hooks.hook("connect:factory", ({ request, endCursor }) => {
      if (request.filter[1]) {
        store.put({ cursor: endCursor, filter: request.filter[1] });
      }
    });
  });
}

export class SqlitePersistence<TFilter> {
  /** Sqlite Queries Prepare Statements */
  private _getCheckpointQuery: Statement<string, CheckpointRow>;
  private _putCheckpointQuery: Statement<
    [string, number, `0x${string}` | undefined]
  >;
  private _delCheckpointQuery: Statement<string>;
  private _getFilterQuery: Statement<string, FilterRow>;
  private _updateFilterToBlockQuery: Statement<[number, string]>;
  private _insertFilterQuery: Statement<[string, string, number]>;
  private _delFilterQuery: Statement<string>;

  constructor(private _db: SqliteDatabase) {
    this._getCheckpointQuery = this._db.prepare(statements.getCheckpoint);
    this._putCheckpointQuery = this._db.prepare(statements.putCheckpoint);
    this._delCheckpointQuery = this._db.prepare(statements.delCheckpoint);
    this._getFilterQuery = this._db.prepare(statements.getFilter);
    this._updateFilterToBlockQuery = this._db.prepare(
      statements.updateFilterToBlock,
    );
    this._insertFilterQuery = this._db.prepare(statements.insertFilter);
    this._delFilterQuery = this._db.prepare(statements.delFilter);
  }

  static initialize(db: SqliteDatabase) {
    db.prepare(statements.createCheckpointsTable).run();
    db.prepare(statements.createFiltersTable).run();
  }

  public get(): { cursor?: Cursor; filter?: TFilter } {
    const cursor = this._getCheckpoint();
    const filter = this._getFilter();

    return { cursor, filter };
  }

  public put({ cursor, filter }: { cursor?: Cursor; filter?: TFilter }) {
    if (cursor) {
      this._putCheckpoint(cursor);

      if (filter) {
        this._putFilter(filter, cursor);
      }
    }
  }

  public del() {
    this._delCheckpoint();
    this._delFilter();
  }

  // --- CHECKPOINTS TABLE METHODS ---

  private _getCheckpoint(): Cursor | undefined {
    const row = this._getCheckpointQuery.get("default");

    if (!row) return undefined;

    return { orderKey: BigInt(row.order_key), uniqueKey: row.unique_key };
  }

  private _putCheckpoint(cursor: Cursor) {
    this._putCheckpointQuery.run(
      "default",
      Number(cursor.orderKey),
      cursor.uniqueKey,
    );
  }

  private _delCheckpoint() {
    this._delCheckpointQuery.run("default");
  }

  // --- FILTERS TABLE METHODS ---

  private _getFilter(): TFilter | undefined {
    const row = this._getFilterQuery.get("default");

    if (!row) return undefined;

    return deserialize(row.filter) as TFilter;
  }

  private _putFilter(filter: TFilter, endCursor: Cursor) {
    this._updateFilterToBlockQuery.run(Number(endCursor.orderKey), "default");
    this._insertFilterQuery.run(
      "default",
      serialize(filter as Record<string, unknown>),
      Number(endCursor.orderKey),
    );
  }

  private _delFilter() {
    this._delFilterQuery.run("default");
  }
}

const statements = {
  beginTxn: "BEGIN TRANSACTION",
  commitTxn: "COMMIT TRANSACTION",
  rollbackTxn: "ROLLBACK TRANSACTION",
  createCheckpointsTable: `
    CREATE TABLE IF NOT EXISTS checkpoints (
      id TEXT NOT NULL PRIMARY KEY,
      order_key INTEGER NOT NULL,
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
};

export type CheckpointRow = {
  id: string;
  order_key: number;
  unique_key?: `0x${string}`;
};

export type FilterRow = {
  id: string;
  filter: string;
  from_block: number;
  to_block?: number;
};
