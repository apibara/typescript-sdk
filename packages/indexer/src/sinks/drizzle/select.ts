import type { Cursor } from "@apibara/protocol";
import {
  type ExtractTablesWithRelations,
  type SQL,
  type Subquery,
  type TablesRelationalConfig,
  sql,
} from "drizzle-orm";
import type {
  PgQueryResultHKT,
  PgTable,
  PgTransaction,
  SelectedFields,
} from "drizzle-orm/pg-core";
import type { PgViewBase } from "drizzle-orm/pg-core/view-base";

export class DrizzleSinkSelect<
  TSelection extends SelectedFields,
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
> {
  constructor(
    private db: PgTransaction<TQueryResult, TFullSchema, TSchema>,
    private fields?: TSelection,
    private endCursor?: Cursor,
  ) {}

  from<TFrom extends PgTable | Subquery | PgViewBase | SQL>(source: TFrom) {
    if (this.fields) {
      const originalFrom = this.db.select(this.fields).from(source);
      return {
        ...originalFrom,
        where: (where?: SQL) => {
          const combinedWhere = sql`${where ? sql`${where} AND ` : sql``}upper_inf(_cursor)`;
          return originalFrom.where(combinedWhere);
        },
      };
    }

    return this.db.select().from(source).where(sql`upper_inf(_cursor)`);
  }
}
