import type { Cursor } from "@apibara/protocol";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import type {
  ExtractTablesWithRelations,
  TablesRelationalConfig,
} from "drizzle-orm";
import type { PgQueryResultHKT, PgTransaction } from "drizzle-orm/pg-core";
import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { DrizzleStorageError, deserialize, serialize } from "./utils";

const CHECKPOINTS_TABLE_NAME = "__indexer_checkpoints";
const FILTERS_TABLE_NAME = "__indexer_filters";
const SCHEMA_VERSION_TABLE_NAME = "__indexer_schema_version";

export const checkpoints = pgTable(CHECKPOINTS_TABLE_NAME, {
  id: text("id").notNull().primaryKey(),
  orderKey: integer("order_key").notNull(),
  uniqueKey: text("unique_key")
    .$type<`0x${string}` | undefined>()
    .notNull()
    .default(undefined),
});

export const filters = pgTable(
  FILTERS_TABLE_NAME,
  {
    id: text("id").notNull(),
    filter: text("filter").notNull(),
    fromBlock: integer("from_block").notNull(),
    toBlock: integer("to_block").$type<number | null>().default(null),
  },
  (table) => [
    {
      pk: primaryKey({ columns: [table.id, table.fromBlock] }),
    },
  ],
);

export const schemaVersion = pgTable(SCHEMA_VERSION_TABLE_NAME, {
  k: integer("k").notNull().primaryKey(),
  version: integer("version").notNull(),
});

export const CURRENT_SCHEMA_VERSION = 0;

// migrations for future schema updates
const MIGRATIONS: string[][] = [
  // migrations[0]: v0 -> v1 (for future use)
  [],
  // Add more migration arrays for future versions
];

export async function initializePersistentState<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(tx: PgTransaction<TQueryResult, TFullSchema, TSchema>) {
  // Create schema version table
  await tx.execute(`
    CREATE TABLE IF NOT EXISTS ${SCHEMA_VERSION_TABLE_NAME} (
      k INTEGER PRIMARY KEY,
      version INTEGER NOT NULL
    );
  `);

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
      await tx.execute(`
        CREATE TABLE IF NOT EXISTS ${CHECKPOINTS_TABLE_NAME} (
          id TEXT PRIMARY KEY,
          order_key INTEGER NOT NULL,
          unique_key TEXT NOT NULL DEFAULT ''
        );
      `);

      await tx.execute(`
        CREATE TABLE IF NOT EXISTS ${FILTERS_TABLE_NAME} (
          id TEXT NOT NULL,
          filter TEXT NOT NULL,
          from_block INTEGER NOT NULL,
          to_block INTEGER DEFAULT NULL,
          PRIMARY KEY (id, from_block)
        );
      `);

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
          orderKey: Number(endCursor.orderKey),
          uniqueKey: endCursor.uniqueKey,
        })
        .onConflictDoUpdate({
          target: checkpoints.id,
          set: {
            orderKey: Number(endCursor.orderKey),
            uniqueKey: endCursor.uniqueKey,
          },
        });

      if (filter) {
        await tx
          .update(filters)
          .set({ toBlock: Number(endCursor.orderKey) })
          .where(and(eq(filters.id, indexerId), isNull(filters.toBlock)));

        await tx
          .insert(filters)
          .values({
            id: indexerId,
            filter: serialize(filter),
            fromBlock: Number(endCursor.orderKey),
            toBlock: null,
          })
          .onConflictDoUpdate({
            target: [filters.id, filters.fromBlock],
            set: {
              filter: serialize(filter),
              fromBlock: Number(endCursor.orderKey),
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
      ? {
          orderKey: BigInt(checkpointRows[0].orderKey),
          uniqueKey: checkpointRows[0].uniqueKey,
        }
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
      .delete(filters)
      .where(
        and(
          eq(filters.id, indexerId),
          gt(filters.fromBlock, Number(cursor.orderKey)),
        ),
      );

    await tx
      .update(filters)
      .set({ toBlock: null })
      .where(
        and(
          eq(filters.id, indexerId),
          gt(filters.toBlock, Number(cursor.orderKey)),
        ),
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
        and(
          eq(filters.id, indexerId),
          lt(filters.toBlock, Number(cursor.orderKey)),
        ),
      );
  } catch (error) {
    throw new DrizzleStorageError("Failed to finalize state", {
      cause: error,
    });
  }
}
