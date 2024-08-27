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
  TTableConfig extends Record<string, TableConfig>,
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
> = {
  /**
   * Database instance of drizzle-orm
   */
  database: PgDatabase<TQueryResult, TFullSchema, TSchema>;
  /**
   * The tables where data will be inserted.
   */
  tables: DrizzleSinkTables<TTableConfig>;
};

export class DrizzleSink<
  TTableConfig extends Record<string, TableConfig>,
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
> extends Sink {
  private _tables: DrizzleSinkTables<TTableConfig>;
  private _db: PgDatabase<TQueryResult, TFullSchema, TSchema>;

  constructor(
    options: DrizzleSinkOptions<
      TTableConfig,
      TQueryResult,
      TFullSchema,
      TSchema
    >,
  ) {
    super();
    const { database, tables } = options;
    this._tables = tables;
    this._db = database;
  }

  async transaction(
    cb: (params: {
      db: PgTransaction<TQueryResult, TFullSchema, TSchema>;
      tables: DrizzleSinkTables<TTableConfig>;
    }) => Promise<void>,
  ): Promise<void> {
    await this._db.transaction(async (db) => {
      await cb({ db, tables: this._tables });
    });
  }
}

export const drizzle = <
  TTableConfig extends Record<string, TableConfig>,
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(
  args: DrizzleSinkOptions<TTableConfig, TQueryResult, TFullSchema, TSchema>,
) => {
  return new DrizzleSink(args);
};
