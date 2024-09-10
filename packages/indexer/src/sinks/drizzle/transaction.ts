import type { Cursor } from "@apibara/protocol";
import {
  type ExtractTablesWithRelations,
  type SQL,
  type Subquery,
  type TablesRelationalConfig,
  sql,
} from "drizzle-orm";
import type {
  PgInsertBuilder,
  PgInsertValue,
  PgQueryResultHKT,
  PgSelectBuilder,
  PgTable,
  PgTransaction,
  SelectedFields,
} from "drizzle-orm/pg-core";
import type { PgViewBase } from "drizzle-orm/pg-core/view-base";
import type { Int8Range } from "./Int8Range";
import { DrizzleSinkDelete } from "./delete";
import { DrizzleSinkUpdate } from "./update";
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
    // TODO: confirmation needed
    return {
      ...originalInsert,
      values: (values: PgInsertValue<TTable> | PgInsertValue<TTable>[]) => {
        const cursoredValues = (Array.isArray(values) ? values : [values]).map(
          (v) => {
            return {
              ...v,
              _cursor: getDrizzleCursor(this.endCursor?.orderKey) as Int8Range,
            };
          },
        );
        return originalInsert.values(cursoredValues as PgInsertValue<TTable>[]);
      },
    } as PgInsertBuilder<TTable, TQueryResult>;
  }

  update<TTable extends PgTable>(table: TTable) {
    // TODO: confirmation needed
    return new DrizzleSinkUpdate(this.db, table, this.endCursor);
  }

  delete<TTable extends PgTable>(table: TTable) {
    // TODO: confirmation needed
    return new DrizzleSinkDelete(this.db, table, this.endCursor);
  }

  select(fields?: SelectedFields): PgSelectBuilder<SelectedFields | undefined>;
  select<TSelection extends SelectedFields>(
    fields: TSelection,
  ): PgSelectBuilder<TSelection> {
    const originalSelect = this.db.select(fields);
    // TODO: confirmation needed
    return {
      ...originalSelect,
      from: <TFrom extends PgTable | Subquery | PgViewBase | SQL>(
        source: TFrom,
      ) => {
        const originalFrom = originalSelect.from(source);
        return {
          ...originalFrom,
          where: (where: SQL) => {
            // TODO: confirmation needed
            const newWhere = sql`${where} AND upper_inf(${sql.raw("_cursor")})`;
            return originalFrom.where(newWhere);
          },
        };
      },
    } as PgSelectBuilder<TSelection>;
  }
}
