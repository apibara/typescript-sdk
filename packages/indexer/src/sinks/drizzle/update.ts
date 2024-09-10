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
import type { Int8Range } from "./Int8Range";
import { getDrizzleCursor } from "./utils";

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

  where(values: PgUpdateSetSource<TTable>): PgUpdateBase<TTable, TQueryResult> {
    const originalUpdate = this.db.update(this.table);
    const originalSet = originalUpdate.set(values);

    return {
      ...originalSet,
      where: async (where: SQL) => {
        const existingRows = await this.db
          .select()
          .from(this.table)
          .where(sql`${where} AND upper_inf(${sql.raw("_cursor")})`);

        // Insert old values with updated cursor
        if (existingRows.length > 0) {
          await this.db
            .insert(this.table)
            .values(
              existingRows.map((row) => ({
                ...row,
                _cursor: getDrizzleCursor([
                  BigInt((row._cursor as Int8Range).range.lower!),
                  this.endCursor?.orderKey!,
                ]),
              })),
            )
            .execute();
        }

        const originalWhere = originalSet.where(where);

        return originalWhere;
      },
    } as PgUpdateBase<TTable, TQueryResult>;
  }
}
