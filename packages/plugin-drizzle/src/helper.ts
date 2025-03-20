import { PGlite, type PGliteOptions } from "@electric-sql/pglite";
import type { DrizzleConfig } from "drizzle-orm";
import type { MigrationConfig } from "drizzle-orm/migrator";
import {
  type NodePgDatabase as OriginalNodePgDatabase,
  drizzle as drizzleNode,
} from "drizzle-orm/node-postgres";
import { migrate as migrateNode } from "drizzle-orm/node-postgres/migrator";
import {} from "drizzle-orm/pg-core";
import {
  type PgliteDatabase as OriginalPgliteDatabase,
  drizzle as drizzlePGLite,
} from "drizzle-orm/pglite";
import { migrate as migratePGLite } from "drizzle-orm/pglite/migrator";
import pg from "pg";
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

  if (connectionString.startsWith("postgres://") || type === "node-postgres") {
    const pool = new pg.Pool({
      connectionString,
      ...(poolConfig || {}),
    });
    return drizzleNode(pool, { schema, ...(config || {}) }) as Database<
      TOptions,
      TSchema
    >;
  }

  if (type === "pglite") {
    return drizzlePGLite({
      schema: schema as TSchema,
      connection: {
        dataDir: connectionString || "memory://pglite",
      },
      ...(config || {}),
    }) as Database<TOptions, TSchema>;
  }

  throw new Error("Invalid database type");
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
  const isPglite = !!("$client" in db && db.$client instanceof PGlite);

  try {
    if (isPglite) {
      await migratePGLite(db as PgliteDatabase<TSchema>, options);
    } else {
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
