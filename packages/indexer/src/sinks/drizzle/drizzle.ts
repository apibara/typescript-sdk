import type { Cursor } from "@apibara/protocol";
import type {
  ExtractTablesWithRelations,
  TablesRelationalConfig,
} from "drizzle-orm";
import type {
  PgDatabase,
  PgQueryResultHKT,
  PgTableWithColumns,
  TableConfig,
} from "drizzle-orm/pg-core";
import { Sink } from "../../sink";
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

  constructor(options: DrizzleSinkOptions<TQueryResult, TFullSchema, TSchema>) {
    super();
    const { database } = options;
    this._db = database;
  }

  async transaction(
    cb: (params: {
      transaction: (
        endCursor?: Cursor,
      ) => DrizzleSinkTransaction<TQueryResult, TFullSchema, TSchema>;
    }) => Promise<void>,
  ): Promise<void> {
    await this._db.transaction(async (db) => {
      const transaction = (endCursor?: Cursor) => {
        return new DrizzleSinkTransaction(db, endCursor);
      };

      await cb({ transaction });
    });
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
