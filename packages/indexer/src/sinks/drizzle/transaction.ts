import type { Cursor } from "@apibara/protocol";
import type {
  ExtractTablesWithRelations,
  TablesRelationalConfig,
} from "drizzle-orm";
import type {
  PgQueryResultHKT,
  PgSelectBuilder,
  PgTable,
  PgTransaction,
  SelectedFields,
} from "drizzle-orm/pg-core";
import { DrizzleSinkDelete } from "./delete";
import { DrizzleSinkInsert } from "./insert";
import { DrizzleSinkSelect } from "./select";
import { DrizzleSinkUpdate } from "./update";

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

  insert<TTable extends PgTable>(table: TTable) {
    return new DrizzleSinkInsert(this.db, table, this.endCursor);
  }

  update<TTable extends PgTable>(table: TTable) {
    return new DrizzleSinkUpdate(this.db, table, this.endCursor);
  }

  delete<TTable extends PgTable>(table: TTable) {
    return new DrizzleSinkDelete(this.db, table, this.endCursor);
  }

  // @ts-ignore
  select(): PgSelectBuilder<undefined>;
  select<TSelection extends SelectedFields>(
    fields: TSelection,
  ): PgSelectBuilder<TSelection>;
  select(fields?: SelectedFields) {
    return new DrizzleSinkSelect(this.db, fields, this.endCursor);
  }
}
