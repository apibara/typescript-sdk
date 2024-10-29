import type {
  BuildColumns,
  BuildExtraConfigColumns,
  NotNull,
  Placeholder,
  SQL,
} from "drizzle-orm";
import type {
  PgColumnBuilderBase,
  PgCustomColumnBuilder,
  PgTable,
  PgTableExtraConfig,
  PgTableWithColumns,
} from "drizzle-orm/pg-core";
import { pgTable as drizzlePgTable } from "drizzle-orm/pg-core";
import range from "postgres-range";
import { Int8Range, int8range } from "./Int8Range";

export type CursorColumnBuilder = NotNull<
  PgCustomColumnBuilder<{
    name: "_cursor";
    dataType: "custom";
    columnType: "PgCustomColumn";
    data: Int8Range;
    driverParam: undefined;
    enumValues: undefined;
    generated: undefined;
  }>
>;

// Redefining the type of `pgTable` to include the `_cursor` column.
export type PgIndexerTableWithCursorFn<
  TSchema extends string | undefined = undefined,
> = <
  TTableName extends string,
  TColumnsMap extends Record<string, PgColumnBuilderBase>,
>(
  name: TTableName,
  columns: TColumnsMap,
  extraConfig?: (
    self: BuildExtraConfigColumns<
      TTableName,
      TColumnsMap & { _cursor: CursorColumnBuilder },
      "pg"
    >,
  ) => PgTableExtraConfig,
) => PgTableWithColumns<{
  name: TTableName;
  schema: TSchema;
  columns: BuildColumns<
    TTableName,
    TColumnsMap & { _cursor: CursorColumnBuilder },
    "pg"
  >;
  dialect: "pg";
}>;

// Same as the drizzle's `PgInsertValue` type, but without the `_cursor` column.
export type PgInsertValue<TTable extends PgTable> = Omit<
  {
    [Key in keyof TTable["$inferInsert"]]:
      | TTable["$inferInsert"][Key]
      | SQL
      | Placeholder;
  } & {},
  "_cursor"
>;

export const pgIndexerTable: PgIndexerTableWithCursorFn = (
  name,
  columns,
  extraConfig?,
) => {
  return drizzlePgTable(
    name,
    {
      ...columns,
      _cursor: int8range("_cursor").notNull(),
    },
    extraConfig,
  );
};

export const getDrizzleCursor = (
  cursor_range: [bigint | undefined, bigint | undefined] | bigint | undefined,
) => {
  const isArray = Array.isArray(cursor_range);
  const [lower, upper] = isArray ? cursor_range : [cursor_range, undefined];
  let isNoUpperBound = false;
  if (lower === undefined) {
    throw new Error("Lower bound cursor is required");
  }
  if (upper === undefined) {
    isNoUpperBound = true;
  }
  return new Int8Range(
    new range.Range(
      Number(lower),
      Number(upper),
      range.RANGE_LB_INC | (isNoUpperBound ? range.RANGE_UB_INF : 0),
    ),
  );
};
