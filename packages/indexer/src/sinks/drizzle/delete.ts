import type { Cursor } from "@apibara/protocol";
import {
  type ExtractTablesWithRelations,
  type SQL,
  type TablesRelationalConfig,
  sql,
} from "drizzle-orm";
import type {
  PgQueryResultHKT,
  PgTable,
  PgTransaction,
  PgUpdateBase,
} from "drizzle-orm/pg-core";

export class DrizzleSinkDelete<
  TTable extends PgTable,
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
> {
  constructor(
    private db: PgTransaction<TQueryResult, TFullSchema, TSchema>,
    private table: TTable,
    private endCursor?: Cursor,
  ) {}

  //@ts-ignore
  where(where: SQL): Omit<
    // for type safety used PgUpdateBase instead of PgDeleteBase
    PgUpdateBase<TTable, TQueryResult, undefined, false, "where">,
    "where"
  > {
    const updatedRows = this.db
      .update(this.table)
      .set({
        // @ts-ignore
        _cursor: sql`int8range(lower(_cursor), ${this.endCursor?.orderKey!}, '[]')`,
      })
      .where(where);

    return {
      ...updatedRows,
    };
  }
}
