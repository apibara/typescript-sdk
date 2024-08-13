import type {
  ExtractTablesWithRelations,
  TablesRelationalConfig,
} from "drizzle-orm";
import type {
  PgDatabase,
  PgInsertValue,
  PgQueryResultHKT,
  PgTable,
  PgTableWithColumns,
  TableConfig,
} from "drizzle-orm/pg-core";
import { Sink, type SinkWriteArgs } from "../sink";

export type DrizzleSinkOptions<
  TTableConfig extends TableConfig,
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
   * The table where data will be inserted.
   */
  table: PgTableWithColumns<TTableConfig>;
};

export class DrizzleSink<
  TTableConfig extends TableConfig,
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
> extends Sink {
  private _table: PgTableWithColumns<TTableConfig>;
  private _db: PgDatabase<TQueryResult, TFullSchema, TSchema>;

  public $inferTransform: Promise<PgInsertValue<PgTable<TTableConfig>>[]> =
    Promise.resolve([]);

  constructor(
    options: DrizzleSinkOptions<
      TTableConfig,
      TQueryResult,
      TFullSchema,
      TSchema
    >,
  ) {
    super();
    const { database, table } = options;
    this._table = table;
    this._db = database;
  }

  async write({ data, endCursor, finality }: SinkWriteArgs) {
    await this.callHook("write", { data });

    await this._db
      .insert(this._table)
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      .values(data as any[]);

    await this.callHook("flush", { endCursor, finality });
  }
}

export const drizzle = <
  TTableConfig extends TableConfig,
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(
  args: DrizzleSinkOptions<TTableConfig, TQueryResult, TFullSchema, TSchema>,
) => {
  return new DrizzleSink(args);
};
