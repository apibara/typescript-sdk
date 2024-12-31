import { sql } from "drizzle-orm";
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { type PgliteDatabase, drizzle } from "drizzle-orm/pglite";
import { DrizzleStorageError } from "../src/utils";

export const testTable = pgTable("test", {
  id: serial("id").primaryKey(),
  blockNumber: integer("block_number").notNull(),
  key: text("key"),
  count: integer("count"),
  data: text("data"),
});

export type TestTableType = typeof testTable.$inferSelect;

export type PgLiteDb = PgliteDatabase<{ test: typeof testTable }>;

export async function getPgliteDb(): Promise<PgLiteDb> {
  const dbName = crypto.randomUUID().replace(/-/g, "_");

  const db = drizzle({
    // @ts-ignore
    schema: {
      test: testTable,
    },
    connection: {
      // debug: true,
      dataDir: `memory://${dbName}`,
    },
  });

  await migratePgliteDb(db);

  return db;
}

export async function migratePgliteDb(db: PgLiteDb) {
  try {
    await db.execute(
      sql.raw(`
        CREATE TABLE IF NOT EXISTS test (
          id SERIAL PRIMARY KEY,
          block_number INTEGER NOT NULL,
          key TEXT,
          count INTEGER,
          data TEXT
        );
      `),
    );
  } catch (error) {
    console.error(error);
    throw new DrizzleStorageError(`Migration failed: ${error}`);
  }
}
