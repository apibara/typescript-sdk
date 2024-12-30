import type {
  ExtractTablesWithRelations,
  TablesRelationalConfig,
} from "drizzle-orm";
import type {
  PgDatabase,
  PgQueryResultHKT,
  PgTransaction,
} from "drizzle-orm/pg-core";

export class DrizzleStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DrizzleStorageError";
  }
}

export async function withTransaction<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(
  db: PgDatabase<TQueryResult, TFullSchema, TSchema>,
  cb: (db: PgTransaction<TQueryResult, TFullSchema, TSchema>) => Promise<void>,
) {
  return await db.transaction(async (txnDb) => {
    return await cb(txnDb);
  });
}

export function deserialize<T>(str: string): T {
  return JSON.parse(str, (_, value) =>
    typeof value === "string" && value.match(/^\d+n$/)
      ? BigInt(value.slice(0, -1))
      : value,
  ) as T;
}

export function serialize<T>(obj: T): string {
  return JSON.stringify(
    obj,
    (_, value) => (typeof value === "bigint" ? `${value.toString()}n` : value),
    "\t",
  );
}
