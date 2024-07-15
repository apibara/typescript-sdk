import type { Cursor } from "@apibara/protocol";
import Database, { type Database as SqliteDatabase } from "better-sqlite3";
import { deserialize, serialize } from "../vcr";
import { defineIndexerPlugin } from "./config";

type SqliteArgs = Database.Options & {
  filename: string | Buffer | undefined;
};

export function sqlitePersistence<TFilter, TBlock, TRet>(args: SqliteArgs) {
  return defineIndexerPlugin<TFilter, TBlock, TRet>((indexer) => {
    let db: SqliteDatabase;
    let store: SqlitePersistence<TFilter>;

    indexer.hooks.hook("run:before", () => {
      const { filename, ...sqliteOptions } = args;
      db = new Database(filename, sqliteOptions);

      SqlitePersistence.initialize(db);

      store = new SqlitePersistence(db);
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

    indexer.hooks.hook("sink:flush", ({ endCursor }) => {
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
  constructor(private _db: SqliteDatabase) {}

  static initialize(db: SqliteDatabase) {
    db.pragma("journal_mode = WAL");

    db.prepare(`
      CREATE TABLE IF NOT EXISTS checkpoints (
        id TEXT NOT NULL PRIMARY KEY,
        order_key INTEGER NOT NULL,
        unique_key TEXT
      );
    `).run();

    db.prepare(`
      CREATE TABLE IF NOT EXISTS filters (
        id TEXT NOT NULL,
        filter BLOB NOT NULL,
        from_block INTEGER NOT NULL,
        to_block INTEGER,
        PRIMARY KEY (id, from_block)
      ); 
    `).run();
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
    const row = this._db
      .prepare<string, CheckpointRow>(
        `
      SELECT *
      FROM checkpoints
      WHERE id = ?
    `,
      )
      .get("default");

    if (!row) return undefined;

    return { orderKey: BigInt(row.order_key), uniqueKey: row.unique_key };
  }

  private _putCheckpoint(cursor: Cursor) {
    this._db
      .prepare(
        `
      INSERT INTO checkpoints (id, order_key, unique_key)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
      order_key = excluded.order_key,
      unique_key = excluded.unique_key
    `,
      )
      .run("default", Number(cursor.orderKey), cursor.uniqueKey);
  }

  private _delCheckpoint() {
    this._db
      .prepare(
        `
      DELETE FROM checkpoints
      WHERE id = ?
    `,
      )
      .run("default");
  }

  // --- FILTERS TABLE METHODS ---

  private _getFilter(): TFilter | undefined {
    const row = this._db
      .prepare<string, FilterRow>(
        `
      SELECT *
      FROM filters
      WHERE id = ? AND to_block IS NULL
    `,
      )
      .get("default");

    if (!row) return undefined;

    return deserialize(row.filter) as TFilter;
  }

  private _putFilter(filter: TFilter, endCursor: Cursor) {
    this._db
      .prepare(
        `
      UPDATE filters
      SET to_block = ?
      WHERE id = ? AND to_block IS NULL
    `,
      )
      .run(Number(endCursor.orderKey), "default");

    this._db
      .prepare(
        `
      INSERT INTO filters (id, filter, from_block)
      VALUES (?, ?, ?)
      ON CONFLICT(id, from_block) DO UPDATE SET
      filter = excluded.filter,
      from_block = excluded.from_block
    `,
      )
      .run(
        "default",
        serialize(filter as Record<string, unknown>),
        Number(endCursor.orderKey),
      );
  }

  private _delFilter() {
    this._db
      .prepare(
        `
      DELETE FROM filters
      WHERE id = ?
    `,
      )
      .run("default");
  }
}

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
