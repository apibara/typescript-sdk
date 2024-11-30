import type { Cursor } from "@apibara/protocol";
import {
  type ExtractTablesWithRelations,
  type TablesRelationalConfig,
  and,
  eq,
  isNull,
} from "drizzle-orm";
import {
  type PgDatabase,
  type PgQueryResultHKT,
  integer,
  pgTable,
  primaryKey,
  text,
} from "drizzle-orm/pg-core";
import { deserialize, serialize } from "../vcr";
import { defineIndexerPlugin } from "./config";

export const checkpoints = pgTable("checkpoints", {
  id: text("id").notNull().primaryKey(),
  orderKey: integer("order_key").notNull(),
  uniqueKey: text("unique_key")
    .$type<`0x${string}` | undefined>()
    .notNull()
    .default(undefined),
});

export const filters = pgTable(
  "filters",
  {
    id: text("id").notNull(),
    filter: text("filter").notNull(),
    fromBlock: integer("from_block").notNull(),
    toBlock: integer("to_block"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.fromBlock] }),
  }),
);

export function drizzlePersistence<
  TFilter,
  TBlock,
  TTxnParams,
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>({
  database,
  indexerName = "default",
}: {
  database: PgDatabase<TQueryResult, TFullSchema, TSchema>;
  indexerName?: string;
}) {
  return defineIndexerPlugin<TFilter, TBlock, TTxnParams>((indexer) => {
    let store: DrizzlePersistence<TFilter, TQueryResult, TFullSchema, TSchema>;

    indexer.hooks.hook("run:before", async () => {
      store = new DrizzlePersistence(database, indexerName);
      // Tables are created by user via migrations in Drizzle
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

    indexer.hooks.hook("transaction:commit", async ({ endCursor }) => {
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

export class DrizzlePersistence<
  TFilter,
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
> {
  constructor(
    private _db: PgDatabase<TQueryResult, TFullSchema, TSchema>,
    private _indexerName: string,
  ) {}

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

  // --- CHECKPOINTS TABLE METHODS ---

  private async _getCheckpoint(): Promise<Cursor | undefined> {
    const rows = await this._db
      .select()
      .from(checkpoints)
      .where(eq(checkpoints.id, this._indexerName));

    const row = rows[0];
    if (!row) return undefined;

    return {
      orderKey: BigInt(row.orderKey),
      uniqueKey: row.uniqueKey,
    };
  }

  private async _putCheckpoint(cursor: Cursor) {
    await this._db
      .insert(checkpoints)
      .values({
        id: this._indexerName,
        orderKey: Number(cursor.orderKey),
        uniqueKey: cursor.uniqueKey,
      })
      .onConflictDoUpdate({
        target: checkpoints.id,
        set: {
          orderKey: Number(cursor.orderKey),
          uniqueKey: cursor.uniqueKey,
        },
      });
  }

  // --- FILTERS TABLE METHODS ---

  private async _getFilter(): Promise<TFilter | undefined> {
    const rows = await this._db
      .select()
      .from(filters)
      .where(and(eq(filters.id, this._indexerName), isNull(filters.toBlock)));

    const row = rows[0];

    if (!row) return undefined;

    return deserialize(row.filter) as TFilter;
  }

  private async _putFilter(filter: TFilter, endCursor: Cursor) {
    // Update existing filter's to_block
    await this._db
      .update(filters)
      .set({ toBlock: Number(endCursor.orderKey) })
      .where(and(eq(filters.id, this._indexerName), isNull(filters.toBlock)));

    // Insert new filter
    await this._db
      .insert(filters)
      .values({
        id: this._indexerName,
        filter: serialize(filter as Record<string, unknown>),
        fromBlock: Number(endCursor.orderKey),
      })
      .onConflictDoUpdate({
        target: [filters.id, filters.fromBlock],
        set: {
          filter: serialize(filter as Record<string, unknown>),
          fromBlock: Number(endCursor.orderKey),
        },
      });
  }
}
