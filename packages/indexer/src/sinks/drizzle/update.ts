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
  PgUpdateSetSource,
} from "drizzle-orm/pg-core";

export class DrizzleSinkUpdate<
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

  set(values: PgUpdateSetSource<TTable>): PgUpdateBase<TTable, TQueryResult> {
    const originalUpdate = this.db.update(this.table);
    const originalSet = originalUpdate.set(values);
    return {
      ...originalSet,
      where: async (where: SQL | undefined) => {
        await this.db
          .update(this.table)
          .set({
            _cursor: sql`int8range(lower(_cursor), ${Number(this.endCursor?.orderKey!)}, '[)')`,
          } as PgUpdateSetSource<TTable>)
          .where(sql`${where ? sql`${where} AND ` : sql``}upper_inf(_cursor)`)
          .execute();

        return originalSet.where(where);
      },
    } as PgUpdateBase<TTable, TQueryResult>;
  }
}
