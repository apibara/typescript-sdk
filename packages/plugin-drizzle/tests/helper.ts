import { sql } from "drizzle-orm";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { type PgliteDatabase, drizzle } from "drizzle-orm/pglite";
import { Pool } from "pg";
import { afterAll } from "vitest";
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

type TemporaryPostgresDatabase = {
  adminConnectionString: string;
  databaseName: string;
  pool: Pool;
};

const temporaryPostgresDatabases: TemporaryPostgresDatabase[] = [];

afterAll(async () => {
  for (const database of temporaryPostgresDatabases.splice(0)) {
    await database.pool.end();
    await dropPostgresDatabase(
      database.adminConnectionString,
      database.databaseName,
    );
  }
});

/**
 * Creates an isolated test database.
 *
 * Tests use PGlite by default. Set TEST_POSTGRES_CONNECTION_STRING to run the
 * same suite against PostgreSQL. The configured PostgreSQL role must be able
 * to create databases; each database is dropped at the end of the test file.
 */
export async function getTestDb(): Promise<PgLiteDb> {
  const postgresConnectionString =
    process.env["TEST_POSTGRES_CONNECTION_STRING"];

  if (postgresConnectionString) {
    return getPostgresDb(postgresConnectionString);
  }

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

async function getPostgresDb(connectionString: string): Promise<PgLiteDb> {
  const databaseName = `apibara_sdk_test_${crypto.randomUUID().replace(/-/g, "_")}`;
  const databaseConnectionUrl = new URL(connectionString);
  databaseConnectionUrl.pathname = `/${databaseName}`;

  const adminPool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10_000,
  });

  try {
    await adminPool.query(`CREATE DATABASE "${databaseName}"`);
  } finally {
    await adminPool.end();
  }

  const pool = new Pool({
    connectionString: databaseConnectionUrl.toString(),
    connectionTimeoutMillis: 10_000,
  });
  const db = drizzleNodePostgres(pool, {
    schema: { testTable },
  }) as unknown as PgLiteDb;

  try {
    await migratePgliteDb(db);
  } catch (error) {
    await pool.end();
    await dropPostgresDatabase(connectionString, databaseName);
    throw error;
  }

  temporaryPostgresDatabases.push({
    adminConnectionString: connectionString,
    databaseName,
    pool,
  });

  return db;
}

async function dropPostgresDatabase(
  connectionString: string,
  databaseName: string,
) {
  const adminPool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10_000,
  });

  try {
    await adminPool.query(
      `DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`,
    );
  } finally {
    await adminPool.end();
  }
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
