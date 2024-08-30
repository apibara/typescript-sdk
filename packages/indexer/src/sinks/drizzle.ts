import type {
  ExtractTablesWithRelations,
  TablesRelationalConfig,
} from "drizzle-orm";
import type {
  PgDatabase,
  PgQueryResultHKT,
  PgTableWithColumns,
  PgTransaction,
  TableConfig,
} from "drizzle-orm/pg-core";
import { Sink } from "../sink";

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
      db: PgTransaction<TQueryResult, TFullSchema, TSchema>;
    }) => Promise<void>,
  ): Promise<void> {
    await this._db.transaction(async (db) => {
      await cb({ db });
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
