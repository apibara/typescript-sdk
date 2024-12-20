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

  set(values: PgUpdateSetSource<TTable>): PgUpdateBase<TTable, TQueryResult> {
    const originalUpdate = this.db.update(this.table);
    const originalSet = originalUpdate.set(values);
    return {
      ...originalSet,
      where: async (where: SQL | undefined) => {
        // 1. Find and store old versions of matching records
        const oldRecords = await this.db
          .select()
          .from(this.table)
          .where(sql`${where ? sql`${where} AND ` : sql``}upper_inf(_cursor)`)
          .execute();

        // 2. Insert old versions with updated upperbound cursor
        if (oldRecords.length > 0) {
          const oldRecordsWithNewCursor = oldRecords.map((record) => ({
            ...record,
            _cursor: getDrizzleCursor([
              BigInt((record._cursor as Int8Range).range.lower!),
              this.endCursor?.orderKey,
            ]),
          }));

          await this.db
            .insert(this.table)
            .values(oldRecordsWithNewCursor)
            .execute();
        }

        // 3. Update matching records with new values and new 'lowerbound' cursor
        return originalUpdate
          .set({
            ...values,
            _cursor: sql`int8range(${Number(this.endCursor?.orderKey!)}, NULL, '[)')`,
          } as PgUpdateSetSource<TTable>)
          .where(sql`${where ? sql`${where} AND ` : sql``}upper_inf(_cursor)`);
      },
    } as PgUpdateBase<TTable, TQueryResult>;
  }
}
