import type { PgTableFn } from "drizzle-orm/pg-core";
import { pgTable as drizzlePgTable } from "drizzle-orm/pg-core";
import range from "postgres-range";
import { Int8Range, int8range } from "./Int8Range";

export const pgTable: PgTableFn = (name, columns, extraConfig?) => {
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
  if (!lower) {
    throw new Error("Lower bound cursor is required");
  }
  if (!upper) {
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
