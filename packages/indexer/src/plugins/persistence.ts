import type { Cursor } from "@apibara/protocol";
import { type Database, type ISqlite, open } from "sqlite";
import { deserialize, serialize } from "../vcr";
import { defineIndexerPlugin } from "./config";

type SqliteArgs = ISqlite.Config;

export function sqlitePersistence<TFilter, TBlock, TRet>(args: SqliteArgs) {
  return defineIndexerPlugin<TFilter, TBlock, TRet>((indexer) => {
    let db: Database;
    let store: SqlitePersistence<TFilter>;

    indexer.hooks.hook("run:before", async () => {
      db = await open(args);

      await SqlitePersistence.initialize(db);

      store = new SqlitePersistence(db);
    });

    indexer.hooks.hook("connect:before", async ({ request }) => {
      const { cursor, filter } = await store.get();

      if (cursor) {
        request.startingCursor = cursor;
      }

      if (filter) {
        request.filter[1] = filter;
      }
    });

    indexer.hooks.hook("sink:flush", async ({ endCursor }) => {
      if (endCursor) {
        await store.put({ cursor: endCursor });
      }
    });

    indexer.hooks.hook("connect:factory", async ({ request, endCursor }) => {
      if (request.filter[1]) {
        await store.put({ cursor: endCursor, filter: request.filter[1] });
      }
    });
  });
}

export class SqlitePersistence<TFilter> {
  constructor(private _db: Database) {}

  static async initialize(db: Database) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS checkpoints (
        id TEXT NOT NULL PRIMARY KEY,
        order_key INTEGER NOT NULL,
        unique_key TEXT
      );

      CREATE TABLE IF NOT EXISTS filters (
        id TEXT NOT NULL,
        filter BLOB NOT NULL,
        from_block INTEGER NOT NULL,
        to_block INTEGER,
        PRIMARY KEY (id, from_block)
      );
    `);
  }

  public async get(): Promise<{ cursor?: Cursor; filter?: TFilter }> {
    const cursor = await this._getCheckpoint();
    const filter = await this._getFilter();

    return { cursor, filter };
  }

  public async put({ cursor, filter }: { cursor?: Cursor; filter?: TFilter }) {
    if (cursor) {
      await this._putCheckpoint(cursor);

      if (filter) {
        await this._putFilter(filter, cursor);
      }
    }
  }

  public async del() {
    await this._delCheckpoint();
    await this._delFilter();
  }

  // --- CHECKPOINTS TABLE METHODS ---

  private async _getCheckpoint(): Promise<Cursor | undefined> {
    const row = await this._db.get<CheckpointRow>(
      `
      SELECT *
      FROM checkpoints
      WHERE id = ?
    `,
      ["default"],
    );

    if (!row) return undefined;

    return { orderKey: BigInt(row.order_key), uniqueKey: row.unique_key };
  }

  private async _putCheckpoint(cursor: Cursor) {
    await this._db.run(
      `
      INSERT INTO checkpoints (id, order_key, unique_key)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
      order_key = excluded.order_key,
      unique_key = excluded.unique_key
    `,
      ["default", Number(cursor.orderKey), cursor.uniqueKey],
    );
  }

  private async _delCheckpoint() {
    await this._db.run(
      `
      DELETE FROM checkpoints
      WHERE id = ?
    `,
      ["default"],
    );
  }

  // --- FILTERS TABLE METHODS ---

  private async _getFilter(): Promise<TFilter | undefined> {
    const row = await this._db.get<FilterRow>(
      `
      SELECT *
      FROM filters
      WHERE id = ? AND to_block IS NULL
    `,
      ["default"],
    );

    if (!row) return undefined;

    return deserialize(row.filter) as TFilter;
  }

  private async _putFilter(filter: TFilter, endCursor: Cursor) {
    await this._db.run(
      `
      UPDATE filters
      SET to_block = ?
      WHERE id = ? AND to_block IS NULL
    `,
      [Number(endCursor.orderKey), "default"],
    );

    await this._db.run(
      `
      INSERT INTO filters (id, filter, from_block)
      VALUES (?, ?, ?)
      ON CONFLICT(id, from_block) DO UPDATE SET
      filter = excluded.filter,
      from_block = excluded.from_block
    `,
      [
        "default",
        serialize(filter as Record<string, unknown>),
        Number(endCursor.orderKey),
      ],
    );
  }

  private async _delFilter() {
    await this._db.run(
      `
      DELETE FROM filters
      WHERE id = ?
    `,
      ["default"],
    );
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
