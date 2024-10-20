import type { Cursor } from "@apibara/protocol";
import type {
  ExtractTablesWithRelations,
  TablesRelationalConfig,
} from "drizzle-orm";
import type {
  PgInsertValue as DrizzleInsertValue,
  PgQueryResultHKT,
  PgTable,
  PgTransaction,
} from "drizzle-orm/pg-core";
import { type PgInsertValue, getDrizzleCursor } from "./utils";

export class DrizzleSinkInsert<
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

  values(values: PgInsertValue<TTable> | PgInsertValue<TTable>[]) {
    const originalInsert = this.db.insert(this.table);
    const cursoredValues = (Array.isArray(values) ? values : [values]).map(
      (v) => {
        return {
          ...v,
          _cursor: getDrizzleCursor(this.endCursor?.orderKey),
        };
      },
    );

    return originalInsert.values(
      cursoredValues as DrizzleInsertValue<TTable>[],
    );
  }
}
