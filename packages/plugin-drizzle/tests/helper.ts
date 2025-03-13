import { sql } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { type PgliteDatabase, drizzle } from "drizzle-orm/pglite";
import { DrizzleStorageError } from "../src/utils";

export const testTable = pgTable("test", {
  id: serial("id").primaryKey(),
  blockNumber: integer("block_number").notNull(),
  key: text("key").unique(),
  count: integer("count"),
  data: text("data"),
  createdAt: timestamp("created_at"),
});

export type TestTableType = typeof testTable.$inferSelect;

export type PgLiteDb = PgliteDatabase<{ testTable: typeof testTable }>;

export async function getPgliteDb(): Promise<PgLiteDb> {
  const dbName = crypto.randomUUID().replace(/-/g, "_");

  const db = drizzle({
    schema: {
      testTable,
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
          key TEXT UNIQUE,
          count INTEGER,
          data TEXT,
          created_at TIMESTAMP
        );
      `),
    );
  } catch (error) {
    throw new DrizzleStorageError("Migration failed", {
      cause: error,
    });
  }
}
