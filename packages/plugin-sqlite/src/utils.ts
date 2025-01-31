import type { Database } from "better-sqlite3";

export type SerializeFn = <T>(value: T) => string;
export type DeserializeFn = <T>(value: string) => T;

export class SqliteStorageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SqliteStorageError";
  }
}

export async function withTransaction(
  db: Database,
  cb: (db: Database) => Promise<void>,
) {
  db.prepare("BEGIN TRANSACTION").run();
  try {
    await cb(db);
  } catch (error) {
    db.prepare("ROLLBACK TRANSACTION").run();
    throw error;
  }
  db.prepare("COMMIT TRANSACTION").run();
}

export function assertInTransaction(db: Database) {
  if (!db.inTransaction) {
    throw new SqliteStorageError("Database is not in transaction");
  }
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

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
