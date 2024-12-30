import type { Cursor } from "@apibara/protocol";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import type {
  ExtractTablesWithRelations,
  TablesRelationalConfig,
} from "drizzle-orm";
import type { PgQueryResultHKT, PgTransaction } from "drizzle-orm/pg-core";
import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { DrizzleStorageError, deserialize, serialize } from "./utils";

export const checkpoints = pgTable("checkpoints", {
  id: text("id").notNull().primaryKey(),
  orderKey: integer("order_key").notNull(),
  uniqueKey: text("unique_key")
    .$type<`0x${string}` | undefined>()
    .notNull()
    .default(undefined),
});

export const filters = pgTable(
  "filters",
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

export async function initializePersistentState<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(tx: PgTransaction<TQueryResult, TFullSchema, TSchema>) {
  try {
    // Try to query both tables
    await tx.select().from(checkpoints).limit(1);
    await tx.select().from(filters).limit(1);
  } catch (error) {
    throw new DrizzleStorageError(
      "Required tables 'checkpoints' and 'filters' not found for persistence.\nPlease run migrations with 'checkpoints' and 'filters' tables before initializing the plugin with persistence.",
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
  indexerName?: string;
}) {
  const { tx, endCursor, filter, indexerName = "default" } = props;

  if (endCursor) {
    await tx
      .insert(checkpoints)
      .values({
        id: indexerName,
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
        .where(and(eq(filters.id, indexerName), isNull(filters.toBlock)));

      await tx
        .insert(filters)
        .values({
          id: indexerName,
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
}

export async function getState<
  TFilter,
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(props: {
  tx: PgTransaction<TQueryResult, TFullSchema, TSchema>;
  indexerName?: string;
}): Promise<{ cursor?: Cursor; filter?: TFilter }> {
  const { tx, indexerName = "default" } = props;

  const checkpointRows = await tx
    .select()
    .from(checkpoints)
    .where(eq(checkpoints.id, indexerName));

  const cursor = checkpointRows[0]
    ? {
        orderKey: BigInt(checkpointRows[0].orderKey),
        uniqueKey: checkpointRows[0].uniqueKey,
      }
    : undefined;

  const filterRows = await tx
    .select()
    .from(filters)
    .where(and(eq(filters.id, indexerName), isNull(filters.toBlock)));

  const filter = filterRows[0]
    ? deserialize<TFilter>(filterRows[0].filter)
    : undefined;

  return { cursor, filter };
}

export async function invalidateState<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(props: {
  tx: PgTransaction<TQueryResult, TFullSchema, TSchema>;
  cursor: Cursor;
  indexerName?: string;
}) {
  const { tx, cursor, indexerName = "default" } = props;

  await tx
    .delete(filters)
    .where(
      and(
        eq(filters.id, indexerName),
        gt(filters.fromBlock, Number(cursor.orderKey)),
      ),
    );

  await tx
    .update(filters)
    .set({ toBlock: null })
    .where(
      and(
        eq(filters.id, indexerName),
        gt(filters.toBlock, Number(cursor.orderKey)),
      ),
    );
}

export async function finalizeState<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(props: {
  tx: PgTransaction<TQueryResult, TFullSchema, TSchema>;
  cursor: Cursor;
  indexerName?: string;
}) {
  const { tx, cursor, indexerName = "default" } = props;

  await tx
    .delete(filters)
    .where(
      and(
        eq(filters.id, indexerName),
        lt(filters.toBlock, Number(cursor.orderKey)),
      ),
    );
}
