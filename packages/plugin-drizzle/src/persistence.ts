import { type Cursor, normalizeCursor } from "@apibara/protocol";
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import type {
  ExtractTablesWithRelations,
  TablesRelationalConfig,
} from "drizzle-orm";
import type { PgQueryResultHKT, PgTransaction } from "drizzle-orm/pg-core";
import {
  bigint,
  integer,
  pgSchema,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { SCHEMA_NAME } from "./constants";
import { DrizzleStorageError, deserialize, serialize } from "./utils";

const CHECKPOINTS_TABLE_NAME = "checkpoints";
const FILTERS_TABLE_NAME = "filters";
const SCHEMA_VERSION_TABLE_NAME = "schema_version";

const schema = pgSchema(SCHEMA_NAME);

/** This table is not used for migrations, its only used for ease of internal operations with drizzle. */
export const checkpoints = schema.table(CHECKPOINTS_TABLE_NAME, {
  id: text("id").notNull().primaryKey(),
  orderKey: bigint("order_key", { mode: "bigint" }).notNull(),
  uniqueKey: text("unique_key"),
});

/** This table is not used for migrations, its only used for ease of internal operations with drizzle. */
export const filters = schema.table(
  FILTERS_TABLE_NAME,
  {
    id: text("id").notNull(),
    filter: text("filter").notNull(),
    fromBlock: bigint("from_block", { mode: "bigint" }).notNull(),
    toBlock: bigint("to_block", { mode: "bigint" })
      .$type<bigint | null>()
      .default(null),
  },
  (table) => [
    {
      pk: primaryKey({ columns: [table.id, table.fromBlock] }),
    },
  ],
);

/** Table for recording chain reorganizations */
export const chainReorganizations = schema.table("chain_reorganizations", {
  id: serial("id").primaryKey(),
  indexerId: text("indexer_id").notNull(),
  oldHeadOrderKey: bigint("old_head_order_key", { mode: "bigint" }),
  oldHeadUniqueKey: text("old_head_unique_key")
    .$type<string | null>()
    .default(null),
  newHeadOrderKey: bigint("new_head_order_key", { mode: "bigint" }).notNull(),
  newHeadUniqueKey: text("new_head_unique_key")
    .$type<string | null>()
    .default(null),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

/** This table is not used for migrations, its only used for ease of internal operations with drizzle. */
export const schemaVersion = schema.table(SCHEMA_VERSION_TABLE_NAME, {
  k: integer("k").notNull().primaryKey(),
  version: integer("version").notNull(),
});

export const CURRENT_SCHEMA_VERSION = 1;

// Each array at index i contains SQL statements to migrate from version i to i+1.
const MIGRATIONS: string[][] = [
  // v0 -> v1: block-number columns promoted from INTEGER to BIGINT
  [
    `ALTER TABLE ${SCHEMA_NAME}.${CHECKPOINTS_TABLE_NAME} ALTER COLUMN order_key TYPE BIGINT`,
    `ALTER TABLE ${SCHEMA_NAME}.${FILTERS_TABLE_NAME} ALTER COLUMN from_block TYPE BIGINT`,
    `ALTER TABLE ${SCHEMA_NAME}.${FILTERS_TABLE_NAME} ALTER COLUMN to_block TYPE BIGINT`,
    `ALTER TABLE ${SCHEMA_NAME}.chain_reorganizations ALTER COLUMN old_head_order_key TYPE BIGINT`,
    `ALTER TABLE ${SCHEMA_NAME}.chain_reorganizations ALTER COLUMN new_head_order_key TYPE BIGINT`,
  ],
];

export async function initializePersistentState<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(tx: PgTransaction<TQueryResult, TFullSchema, TSchema>) {
  // Create schema if it doesn't exist
  await tx.execute(
    sql.raw(`
      CREATE SCHEMA IF NOT EXISTS ${SCHEMA_NAME};
  `),
  );

  // Create schema version table
  await tx.execute(
    sql.raw(`
    CREATE TABLE IF NOT EXISTS ${SCHEMA_NAME}.${SCHEMA_VERSION_TABLE_NAME} (
      k INTEGER PRIMARY KEY,
      version INTEGER NOT NULL
    );
  `),
  );

  await tx.execute(
    sql.raw(`
      CREATE TABLE IF NOT EXISTS ${SCHEMA_NAME}.chain_reorganizations (
        id SERIAL PRIMARY KEY,
        indexer_id TEXT NOT NULL,
        old_head_order_key BIGINT,
        old_head_unique_key TEXT DEFAULT NULL,
        new_head_order_key BIGINT NOT NULL,
        new_head_unique_key TEXT DEFAULT NULL,
        recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `),
  );

  await tx.execute(
    sql.raw(`
      CREATE INDEX IF NOT EXISTS idx_chain_reorgs_indexer_id 
      ON ${SCHEMA_NAME}.chain_reorganizations(indexer_id);
    `),
  );

  // Get current schema version
  const versionRows = await tx
    .select()
    .from(schemaVersion)
    .where(eq(schemaVersion.k, 0));

  const storedVersion = versionRows[0]?.version ?? -1;

  // Check for incompatible version
  if (storedVersion > CURRENT_SCHEMA_VERSION) {
    throw new DrizzleStorageError(
      `Database Persistence schema version v${storedVersion} is newer than supported version v${CURRENT_SCHEMA_VERSION}`,
    );
  }

  // Begin schema updates
  try {
    if (storedVersion === -1) {
      // First time initialization
      await tx.execute(
        sql.raw(`
        CREATE TABLE IF NOT EXISTS ${SCHEMA_NAME}.${CHECKPOINTS_TABLE_NAME} (
          id TEXT PRIMARY KEY,
          order_key BIGINT NOT NULL,
          unique_key TEXT
        );
      `),
      );

      await tx.execute(
        sql.raw(`
        CREATE TABLE IF NOT EXISTS ${SCHEMA_NAME}.${FILTERS_TABLE_NAME} (
          id TEXT NOT NULL,
          filter TEXT NOT NULL,
          from_block BIGINT NOT NULL,
          to_block BIGINT DEFAULT NULL,
          PRIMARY KEY (id, from_block)
        );
      `),
      );

      // Set initial schema version
      await tx.insert(schemaVersion).values({
        k: 0,
        version: CURRENT_SCHEMA_VERSION,
      });
    } else {
      // Run any necessary migrations
      let currentVersion = storedVersion;
      while (currentVersion < CURRENT_SCHEMA_VERSION) {
        const migrationStatements = MIGRATIONS[currentVersion];
        for (const statement of migrationStatements) {
          await tx.execute(statement);
        }
        currentVersion++;
      }

      // Update schema version
      await tx
        .update(schemaVersion)
        .set({ version: CURRENT_SCHEMA_VERSION })
        .where(eq(schemaVersion.k, 0));
    }
  } catch (error) {
    throw new DrizzleStorageError(
      "Failed to initialize or migrate database schema",
      { cause: error },
    );
  }
}

export async function recordChainReorganization<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(props: {
  tx: PgTransaction<TQueryResult, TFullSchema, TSchema>;
  indexerId: string;
  oldHead: Cursor | undefined;
  newHead: Cursor;
}) {
  const { tx, indexerId, oldHead, newHead } = props;

  try {
    await tx.insert(chainReorganizations).values({
      indexerId: indexerId,
      oldHeadOrderKey: oldHead ? oldHead.orderKey : null,
      oldHeadUniqueKey: oldHead?.uniqueKey ? oldHead.uniqueKey : null,
      newHeadOrderKey: newHead.orderKey,
      newHeadUniqueKey: newHead.uniqueKey ? newHead.uniqueKey : null,
    });
  } catch (error) {
    throw new DrizzleStorageError("Failed to record chain reorganization", {
      cause: error,
    });
  }
}

export async function persistState<
  TFilter,
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(props: {
  tx: PgTransaction<TQueryResult, TFullSchema, TSchema>;
  endCursor: Cursor;
  filter?: TFilter;
  indexerId: string;
}) {
  const { tx, endCursor, filter, indexerId } = props;

  try {
    if (endCursor) {
      await tx
        .insert(checkpoints)
        .values({
          id: indexerId,
          orderKey: endCursor.orderKey,
          uniqueKey: endCursor.uniqueKey,
        })
        .onConflictDoUpdate({
          target: checkpoints.id,
          set: {
            orderKey: endCursor.orderKey,
            // Explicitly set the unique key to `null` to indicate that it has been deleted
            // Otherwise drizzle will not update its value.
            uniqueKey: endCursor.uniqueKey ? endCursor.uniqueKey : null,
          },
        });

      if (filter) {
        await tx
          .update(filters)
          .set({ toBlock: endCursor.orderKey })
          .where(and(eq(filters.id, indexerId), isNull(filters.toBlock)));

        await tx
          .insert(filters)
          .values({
            id: indexerId,
            filter: serialize(filter),
            fromBlock: endCursor.orderKey,
            toBlock: null,
          })
          .onConflictDoUpdate({
            target: [filters.id, filters.fromBlock],
            set: {
              filter: serialize(filter),
              fromBlock: endCursor.orderKey,
              toBlock: null,
            },
          });
      }
    }
  } catch (error) {
    throw new DrizzleStorageError("Failed to persist state", {
      cause: error,
    });
  }
}

export async function getState<
  TFilter,
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(props: {
  tx: PgTransaction<TQueryResult, TFullSchema, TSchema>;
  indexerId: string;
}): Promise<{ cursor?: Cursor; filter?: TFilter }> {
  const { tx, indexerId } = props;

  try {
    const checkpointRows = await tx
      .select()
      .from(checkpoints)
      .where(eq(checkpoints.id, indexerId));

    const cursor = checkpointRows[0]
      ? normalizeCursor({
          orderKey: BigInt(checkpointRows[0].orderKey),
          uniqueKey: checkpointRows[0].uniqueKey,
        })
      : undefined;

    const filterRows = await tx
      .select()
      .from(filters)
      .where(and(eq(filters.id, indexerId), isNull(filters.toBlock)));

    const filter = filterRows[0]
      ? deserialize<TFilter>(filterRows[0].filter)
      : undefined;

    return { cursor, filter };
  } catch (error) {
    throw new DrizzleStorageError("Failed to get persistent state", {
      cause: error,
    });
  }
}

export async function invalidateState<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(props: {
  tx: PgTransaction<TQueryResult, TFullSchema, TSchema>;
  cursor: Cursor;
  indexerId: string;
}) {
  const { tx, cursor, indexerId } = props;

  try {
    await tx
      .update(checkpoints)
      .set({
        orderKey: cursor.orderKey,
        uniqueKey: cursor.uniqueKey ? cursor.uniqueKey : null,
      })
      .where(eq(checkpoints.id, indexerId));

    await tx
      .delete(filters)
      .where(
        and(eq(filters.id, indexerId), gt(filters.fromBlock, cursor.orderKey)),
      );

    await tx
      .update(filters)
      .set({ toBlock: null })
      .where(
        and(eq(filters.id, indexerId), gt(filters.toBlock, cursor.orderKey)),
      );
  } catch (error) {
    throw new DrizzleStorageError("Failed to invalidate state", {
      cause: error,
    });
  }
}

export async function finalizeState<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(props: {
  tx: PgTransaction<TQueryResult, TFullSchema, TSchema>;
  cursor: Cursor;
  indexerId: string;
}) {
  const { tx, cursor, indexerId } = props;

  try {
    await tx
      .delete(filters)
      .where(
        and(eq(filters.id, indexerId), lt(filters.toBlock, cursor.orderKey)),
      );
  } catch (error) {
    throw new DrizzleStorageError("Failed to finalize state", {
      cause: error,
    });
  }
}

export async function resetPersistence<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(props: {
  tx: PgTransaction<TQueryResult, TFullSchema, TSchema>;
  indexerId: string;
}) {
  const { tx, indexerId } = props;

  try {
    await tx.delete(checkpoints).where(eq(checkpoints.id, indexerId));
    await tx.delete(filters).where(eq(filters.id, indexerId));
  } catch (error) {
    throw new DrizzleStorageError("Failed to reset persistence state", {
      cause: error,
    });
  }
}
