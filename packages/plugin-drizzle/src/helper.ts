import type { PGlite, PGliteOptions } from "@electric-sql/pglite";
import type { DrizzleConfig } from "drizzle-orm";
import { entityKind } from "drizzle-orm";
import type { MigrationConfig } from "drizzle-orm/migrator";
import type { NodePgDatabase as OriginalNodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase as OriginalPgliteDatabase } from "drizzle-orm/pglite";
import type pg from "pg";
import { DrizzleStorageError } from "./utils";

/**
 * Union type of all possible drizzle database options
 */
export type DrizzleOptions = PgliteDrizzleOptions | NodePgDrizzleOptions;

/**
 * Configuration options for Node-Postgres database connection
 */
export type NodePgDrizzleOptions = {
  /**
   * Type of database to use -
   * - "pglite" - PGLite database
   * - "node-postgres" - Node-Postgres database
   * @default "pglite"
   */
  type: "node-postgres";
  /**
   * Connection string to use for the database
   * @default ""
   */
  connectionString?: string;
  /**
   * Pool configuration options for Node-Postgres
   */
  poolConfig?: pg.PoolConfig;
  /**
   * Additional drizzle configuration options
   */
  config?: Omit<DrizzleConfig, "schema">;
};

/**
 * Configuration options for PGLite database connection
 */
export type PgliteDrizzleOptions = {
  /**
   * Type of database to use -
   * - "pglite" - PGLite database
   * - "node-postgres" - Node-Postgres database
   */
  type?: "pglite";
  /**
   * Connection string to use for the database
   * @default process.env["POSTGRES_CONNECTION_STRING"] ?? "memory://pglite"
   */
  connectionString?: string;
  /**
   * Pool configuration is not supported for PGLite
   */
  poolConfig?: never;
  /**
   * Additional drizzle configuration options with PGLite specific connection options
   */
  config?: Omit<DrizzleConfig, "schema"> & {
    connection?:
      | (PGliteOptions & {
          dataDir?: string;
        })
      | string;
  };
};

/**
 * Extended PGLite database type with client information
 */
export type PgliteDatabase<TSchema extends Record<string, unknown>> =
  OriginalPgliteDatabase<TSchema> & {
    $client: PGlite;
  };

/**
 * Extended Node-Postgres database type with client information
 */
export type NodePgDatabase<TSchema extends Record<string, unknown>> =
  OriginalNodePgDatabase<TSchema> & {
    $client: pg.Pool;
  };

export type Database<
  TOptions extends DrizzleOptions,
  TSchema extends Record<string, unknown>,
> = TOptions extends PgliteDrizzleOptions
  ? PgliteDatabase<TSchema>
  : NodePgDatabase<TSchema>;

/**
 * Creates a new Drizzle database instance based on the provided options
 *
 * @important connectionString defaults to process.env["POSTGRES_CONNECTION_STRING"], if not set, it defaults to "memory://" (in-memory pglite)
 *
 * @param options - Configuration options for the database connection
 * @returns A configured Drizzle database instance
 * @throws {Error} If an invalid database type is specified
 */
export function drizzle<
  TSchema extends Record<string, unknown>,
  TOptions extends DrizzleOptions,
>(
  options?: TOptions & {
    /**
     * Schema to use for the database
     * @default {}
     */
    schema?: TSchema;
  },
): Database<TOptions, TSchema> {
  const {
    connectionString = process.env["POSTGRES_CONNECTION_STRING"] ?? "memory://",
    schema,
    type = "pglite",
    config,
    poolConfig,
  } = options ?? {};

  if (isPgliteConnectionString(connectionString) && type === "pglite") {
    const { drizzle: drizzlePGLite } = require("drizzle-orm/pglite");

    return drizzlePGLite({
      schema: schema as TSchema,
      connection: {
        dataDir: connectionString || "memory://pglite",
      },
      ...(config || {}),
    }) as Database<TOptions, TSchema>;
  }

  const { Pool } = require("pg");
  const { drizzle: drizzleNode } = require("drizzle-orm/node-postgres");
  const pool = new Pool({
    connectionString,
    ...(poolConfig || {}),
  });
  return drizzleNode(pool, { schema, ...(config || {}) }) as Database<
    TOptions,
    TSchema
  >;
}

/**
 * Options for database migration
 */
export type MigrateOptions = MigrationConfig;

/**
 * Performs database migration based on the provided configuration
 * @param db - The database instance to migrate
 * @param options - Migration configuration options
 *
 * @important This function runs migrations on the database instance provided to the `drizzleStorage` plugin.
 * It automatically detects the type of database and runs the appropriate migrate function
 * (PGLite or Node-Postgres).
 *
 * @example
 * ```ts
 * await migrate(db, { migrationsFolder: "./drizzle" });
 * ```
 */
export async function migrate<TSchema extends Record<string, unknown>>(
  db: PgliteDatabase<TSchema> | NodePgDatabase<TSchema>,
  options: MigrateOptions,
) {
  const isPglite = isDrizzleKind(db, "PgliteDatabase");

  try {
    if (isPglite) {
      const { migrate: migratePGLite } = require("drizzle-orm/pglite/migrator");
      await migratePGLite(db as PgliteDatabase<TSchema>, options);
    } else {
      const {
        migrate: migrateNode,
      } = require("drizzle-orm/node-postgres/migrator");
      await migrateNode(db as NodePgDatabase<TSchema>, options);
    }
  } catch (error) {
    throw new DrizzleStorageError(
      "Failed to apply migrations! Please check if you have generated migrations using drizzle:generate",
      {
        cause: error,
      },
    );
  }
}

function isPgliteConnectionString(conn: string) {
  return (
    conn.startsWith("memory://") ||
    conn.startsWith("file://") ||
    conn.startsWith("idb://")
  );
}

function isDrizzleKind(value: unknown, entityKindValue: string) {
  if (!value || typeof value !== "object") {
    return false;
  }
  // https://github.com/drizzle-team/drizzle-orm/blob/f39f885779800982e90dd3c89aba6df3217a6fd2/drizzle-orm/src/entity.ts#L29-L41
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    // Traverse the prototype chain to find the entityKind
    while (cls) {
      // https://github.com/drizzle-team/drizzle-orm/blob/f39f885779800982e90dd3c89aba6df3217a6fd2/drizzle-orm/src/pglite/driver.ts#L41
      if (entityKind in cls && cls[entityKind] === entityKindValue) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }

  return false;
}
