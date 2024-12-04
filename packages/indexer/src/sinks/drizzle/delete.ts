import type { Cursor } from "@apibara/protocol";
import type {
  ExtractTablesWithRelations,
  SQL,
  TablesRelationalConfig,
} from "drizzle-orm";
import type {
  PgQueryResultHKT,
  PgTable,
  PgTransaction,
  PgUpdateBase,
  PgUpdateWithout,
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

  where(
    where: SQL,
  ): PgUpdateWithout<PgUpdateBase<TTable, TQueryResult>, false, "where"> {
    return this.db
      .update(this.table)
      .set({
        // @ts-ignore
        _cursor: sql`int8range(lower(_cursor), ${Number(this.endCursor?.orderKey!)}, '[)')`,
      })
      .where(where) as PgUpdateWithout<
      PgUpdateBase<TTable, TQueryResult>,
      false,
      "where"
    >;
  }
}
