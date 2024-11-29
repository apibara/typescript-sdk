import type { Cursor } from "@apibara/protocol";
import {
  type ExtractTablesWithRelations,
  type TablesRelationalConfig,
  gt,
  sql,
} from "drizzle-orm";
import type {
  AnyPgTable,
  PgDatabase,
  PgQueryResultHKT,
  PgTableWithColumns,
  TableConfig,
} from "drizzle-orm/pg-core";
import { Sink, type SinkCursorParams } from "../../sink";
import { DrizzleSinkTransaction } from "./transaction";

export type DrizzleSinkTables<
  TTableConfig extends Record<string, TableConfig>,
> = {
  [K in keyof TTableConfig]: PgTableWithColumns<TTableConfig[K]>;
};

export type DrizzleSinkOptions<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
> = {
  /**
   * Database instance of drizzle-orm
   */
  database: PgDatabase<TQueryResult, TFullSchema, TSchema>;
  tables: AnyPgTable[];
};

/**
 * A sink that writes data to a PostgreSQL database using Drizzle ORM.
 *
 * @example
 *
 * ```ts
 * const sink = drizzle({
 *   database: db,
 * });
 *
 * ...
 * async transform({context, endCursor}){
 *  const { transaction } = useSink(context);
 *  const db = transaction(endCursor);
 *
 *  db.insert(users).values([
 *    { id: 1, name: "John" },
 *    { id: 2, name: "Jane" },
 *  ]);
 * }
 *
 * ```
 */
export class DrizzleSink<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
> extends Sink {
  private _db: PgDatabase<TQueryResult, TFullSchema, TSchema>;
  private _tables: AnyPgTable[];
  constructor(options: DrizzleSinkOptions<TQueryResult, TFullSchema, TSchema>) {
    super();
    const { database, tables } = options;
    this._db = database;
    this._tables = tables;
  }

  async transaction(
    { cursor, endCursor, finality }: SinkCursorParams,
    cb: (params: {
      db: DrizzleSinkTransaction<TQueryResult, TFullSchema, TSchema>;
    }) => Promise<void>,
  ): Promise<void> {
    await this._db.transaction(async (db) => {
      await cb({ db: new DrizzleSinkTransaction(db, endCursor) });
    });
  }

  async invalidateOnRestart(cursor?: Cursor) {
    await this.invalidate(cursor);
  }

  async invalidate(cursor?: Cursor) {
    await this._db.transaction(async (db) => {
      for (const table of this._tables) {
        // delete all rows whose lowerbound of "_cursor" (int8range) column is greater than the invalidate cursor
        await db
          .delete(table)
          .where(gt(sql`lower(_cursor)`, sql`${Number(cursor?.orderKey)}`))
          .returning();
        // and for rows whose upperbound of "_cursor" (int8range) column is greater than the invalidate cursor, set the upperbound to infinity
        await db
          .update(table)
          .set({
            _cursor: sql`int8range(lower(_cursor), NULL, '[)')`,
          })
          .where(gt(sql`upper(_cursor)`, sql`${Number(cursor?.orderKey)}`));
      }
    });
  }

  async finalize(cursor?: Cursor) {
    // TODO: Implement
    throw new Error("Not implemented");
  }
}

export const drizzle = <
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(
  args: DrizzleSinkOptions<TQueryResult, TFullSchema, TSchema>,
) => {
  return new DrizzleSink(args);
};
