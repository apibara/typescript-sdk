import type { Cursor } from "@apibara/protocol";
import {
  type ExtractTablesWithRelations,
  type SQL,
  type Subquery,
  type TablesRelationalConfig,
  sql,
} from "drizzle-orm";
import type {
  PgDeleteBase,
  PgInsertBuilder,
  PgInsertValue,
  PgQueryResultHKT,
  PgSelectBuilder,
  PgTable,
  PgTransaction,
  PgUpdateBuilder,
  PgUpdateSetSource,
  SelectedFields,
} from "drizzle-orm/pg-core";
import type { PgViewBase } from "drizzle-orm/pg-core/view-base";
import type { Int8Range } from "./Int8Range";
import { getDrizzleCursor } from "./utils";

export class DrizzleSinkTransaction<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
> {
  constructor(
    private db: PgTransaction<TQueryResult, TFullSchema, TSchema>,
    private endCursor?: Cursor,
  ) {}

  insert<TTable extends PgTable>(
    table: TTable,
  ): PgInsertBuilder<TTable, TQueryResult> {
    const originalInsert = this.db.insert(table);
    // TODO
    return {
      ...originalInsert,
      values: (values: PgInsertValue<TTable> | PgInsertValue<TTable>[]) => {
        const cursoredValues = (Array.isArray(values) ? values : [values]).map(
          (v) => ({
            ...v,
            _cursor: getDrizzleCursor(this.endCursor) as Int8Range,
          }),
        );
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        return originalInsert.values(cursoredValues as any);
      },
    } as PgInsertBuilder<TTable, TQueryResult>;
  }

  update<TTable extends PgTable>(
    table: TTable,
  ): PgUpdateBuilder<TTable, TQueryResult> {
    const originalUpdate = this.db.update(table);
    // TODO
    return {
      ...originalUpdate,
      set: (values: PgUpdateSetSource<TTable>) => {
        return originalUpdate.set({
          ...values,
          // TODO
          // _cursor: getDrizzleCursor(this.endCursor) as Int8Range,
        });
      },
    } as PgUpdateBuilder<TTable, TQueryResult>;
  }

  delete<TTable extends PgTable>(
    table: TTable,
  ): PgDeleteBase<TTable, TQueryResult> {
    const originalDelete = this.db.delete(table);
    // TODO
    return {
      ...originalDelete,
      // TODO
    } as PgDeleteBase<TTable, TQueryResult>;
  }

  select<TSelection extends SelectedFields>(
    fields: TSelection,
  ): PgSelectBuilder<TSelection> {
    const originalSelect = this.db.select(fields);
    // TODO
    return {
      ...originalSelect,
      from: <TFrom extends PgTable | Subquery | PgViewBase | SQL>(
        source: TFrom,
      ) => {
        const originalFrom = originalSelect.from(source);
        return {
          ...originalFrom,
          where: (where: SQL) => {
            // TODO
            const newWhere = sql`${where} AND upper_inf(${sql.raw("_cursor")})`;
            return originalFrom.where(newWhere);
          },
        };
      },
    } as PgSelectBuilder<TSelection>;
  }
}
