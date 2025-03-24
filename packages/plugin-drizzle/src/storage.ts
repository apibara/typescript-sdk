import type { Cursor } from "@apibara/protocol";
import {
  type ExtractTablesWithRelations,
  type TablesRelationalConfig,
  sql,
} from "drizzle-orm";
import {
  type PgDatabase,
  type PgQueryResultHKT,
  type PgTransaction,
  char,
  integer,
  jsonb,
  pgSchema,
  serial,
  text,
} from "drizzle-orm/pg-core";
import { SCHEMA_NAME } from "./constants";
import {
  DrizzleStorageError,
  type IdColumnMap,
  getIdColumnForTable,
} from "./utils";

const ROLLBACK_TABLE_NAME = "reorg_rollback";

const schema = pgSchema(SCHEMA_NAME);

function getReorgTriggerName(table: string, indexerId: string) {
  return `${table}_reorg_${indexerId}`;
}

export type ReorgOperation = "I" | "U" | "D";

/** This table is not used for migrations, its only used for ease of internal operations with drizzle. */
export const reorgRollbackTable = schema.table(ROLLBACK_TABLE_NAME, {
  n: serial("n").primaryKey(),
  op: char("op", { length: 1 }).$type<ReorgOperation>().notNull(),
  table_name: text("table_name").notNull(),
  cursor: integer("cursor").notNull(),
  row_id: text("row_id"),
  row_value: jsonb("row_value"),
  indexer_id: text("indexer_id").notNull(),
});

export type ReorgRollbackRow = typeof reorgRollbackTable.$inferSelect;

export async function initializeReorgRollbackTable<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(tx: PgTransaction<TQueryResult, TFullSchema, TSchema>, indexerId: string) {
  try {
    // Create schema if it doesn't exist
    await tx.execute(`
    CREATE SCHEMA IF NOT EXISTS ${SCHEMA_NAME};
    `);
    // Create the audit log table
    await tx.execute(
      sql.raw(`
        CREATE TABLE IF NOT EXISTS ${SCHEMA_NAME}.${ROLLBACK_TABLE_NAME}(
          n SERIAL PRIMARY KEY,
          op CHAR(1) NOT NULL,
          table_name TEXT NOT NULL,
          cursor INTEGER NOT NULL,
          row_id TEXT,
          row_value JSONB,
          indexer_id TEXT NOT NULL
        );
      `),
    );

    await tx.execute(
      sql.raw(`
        CREATE INDEX IF NOT EXISTS idx_reorg_rollback_indexer_id_cursor ON ${SCHEMA_NAME}.${ROLLBACK_TABLE_NAME}(indexer_id, cursor);
      `),
    );
  } catch (error) {
    throw new DrizzleStorageError("Failed to initialize reorg rollback table", {
      cause: error,
    });
  }

  try {
    // Create the trigger function
    await tx.execute(
      sql.raw(`
      CREATE OR REPLACE FUNCTION ${SCHEMA_NAME}.reorg_checkpoint()
      RETURNS TRIGGER AS $$
      DECLARE
        id_col TEXT := TG_ARGV[0]::TEXT;
        order_key INTEGER := TG_ARGV[1]::INTEGER;
        indexer_id TEXT := TG_ARGV[2]::TEXT;
        new_id_value TEXT := row_to_json(NEW.*)->>id_col;
        old_id_value TEXT := row_to_json(OLD.*)->>id_col;
      BEGIN
        IF (TG_OP = 'DELETE') THEN
          INSERT INTO ${SCHEMA_NAME}.${ROLLBACK_TABLE_NAME}(op, table_name, cursor, row_id, row_value, indexer_id)
            SELECT 'D', TG_TABLE_NAME, order_key, old_id_value, row_to_json(OLD.*), indexer_id;
        ELSIF (TG_OP = 'UPDATE') THEN
          INSERT INTO ${SCHEMA_NAME}.${ROLLBACK_TABLE_NAME}(op, table_name, cursor, row_id, row_value, indexer_id)
            SELECT 'U', TG_TABLE_NAME, order_key, new_id_value, row_to_json(OLD.*), indexer_id;
        ELSIF (TG_OP = 'INSERT') THEN
          INSERT INTO ${SCHEMA_NAME}.${ROLLBACK_TABLE_NAME}(op, table_name, cursor, row_id, row_value, indexer_id)
            SELECT 'I', TG_TABLE_NAME, order_key, new_id_value, null, indexer_id;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `),
    );
  } catch (error) {
    throw new DrizzleStorageError(
      "Failed to create reorg checkpoint function",
      {
        cause: error,
      },
    );
  }
}

export async function registerTriggers<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(
  tx: PgTransaction<TQueryResult, TFullSchema, TSchema>,
  tables: string[],
  endCursor: Cursor,
  idColumnMap: IdColumnMap,
  indexerId: string,
) {
  try {
    for (const table of tables) {
      // Determine the column ID for this specific table
      const tableIdColumn = getIdColumnForTable(table, idColumnMap);

      await tx.execute(
        sql.raw(
          `DROP TRIGGER IF EXISTS ${getReorgTriggerName(table, indexerId)} ON ${table};`,
        ),
      );
      await tx.execute(
        sql.raw(`
          CREATE CONSTRAINT TRIGGER ${getReorgTriggerName(table, indexerId)}
          AFTER INSERT OR UPDATE OR DELETE ON ${table}
          DEFERRABLE INITIALLY DEFERRED
          FOR EACH ROW EXECUTE FUNCTION ${SCHEMA_NAME}.reorg_checkpoint('${tableIdColumn}', ${Number(endCursor.orderKey)}, '${indexerId}');
        `),
      );
    }
  } catch (error) {
    throw new DrizzleStorageError("Failed to register triggers", {
      cause: error,
    });
  }
}

export async function removeTriggers<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(
  db: PgDatabase<TQueryResult, TFullSchema, TSchema>,
  tables: string[],
  indexerId: string,
) {
  try {
    for (const table of tables) {
      await db.execute(
        sql.raw(
          `DROP TRIGGER IF EXISTS ${getReorgTriggerName(table, indexerId)} ON ${table};`,
        ),
      );
    }
  } catch (error) {
    throw new DrizzleStorageError("Failed to remove triggers", {
      cause: error,
    });
  }
}

export async function invalidate<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(
  tx: PgTransaction<TQueryResult, TFullSchema, TSchema>,
  cursor: Cursor,
  idColumnMap: IdColumnMap,
  indexerId: string,
) {
  // Get and delete operations after cursor in one query, ordered by newest first
  const { rows: result } = (await tx.execute(
    sql.raw(`
      WITH deleted AS (
        DELETE FROM ${SCHEMA_NAME}.${ROLLBACK_TABLE_NAME}
        WHERE cursor > ${Number(cursor.orderKey)}
        AND indexer_id = '${indexerId}'
        RETURNING *
      )
      SELECT * FROM deleted ORDER BY n DESC;
    `),
  )) as { rows: ReorgRollbackRow[] };

  if (!Array.isArray(result)) {
    throw new DrizzleStorageError(
      "Invalid result format from reorg_rollback query",
    );
  }

  // Process each operation in reverse order
  for (const op of result) {
    // Determine the column ID for this specific table
    const tableIdColumn = getIdColumnForTable(op.table_name, idColumnMap);

    switch (op.op) {
      case "I":
        try {
          if (!op.row_id) {
            throw new DrizzleStorageError("Insert operation has no row_id");
          }

          await tx.execute(
            sql.raw(`
                DELETE FROM ${op.table_name}
                WHERE ${tableIdColumn} = '${op.row_id}'
              `),
          );
        } catch (error) {
          throw new DrizzleStorageError(
            "Failed to invalidate | Operation - I",
            {
              cause: error,
            },
          );
        }

        break;

      case "D":
        try {
          // For deletes, reinsert the row using json_populate_record
          if (!op.row_value) {
            throw new DrizzleStorageError("Delete operation has no row_value");
          }

          await tx.execute(
            sql.raw(`
              INSERT INTO ${op.table_name}
              SELECT * FROM json_populate_record(null::${op.table_name}, '${JSON.stringify(op.row_value)}'::json)
            `),
          );
        } catch (error) {
          throw new DrizzleStorageError(
            "Failed to invalidate | Operation - D",
            {
              cause: error,
            },
          );
        }

        break;

      case "U":
        try {
          if (!op.row_value || !op.row_id) {
            throw new DrizzleStorageError(
              "Update operation has no row_value or row_id",
            );
          }

          // For updates, restore previous values

          const rowValue =
            typeof op.row_value === "string"
              ? JSON.parse(op.row_value)
              : op.row_value;

          const nonIdKeys = Object.keys(rowValue).filter(
            (k) => k !== tableIdColumn,
          );

          const fields = nonIdKeys.map((c) => `${c} = prev.${c}`).join(", ");

          const query = sql.raw(`
              UPDATE ${op.table_name}
              SET ${fields}
              FROM (
                SELECT * FROM json_populate_record(null::${op.table_name}, '${JSON.stringify(op.row_value)}'::json)
              ) as prev
              WHERE ${op.table_name}.${tableIdColumn} = '${op.row_id}'
              `);

          await tx.execute(query);
        } catch (error) {
          throw new DrizzleStorageError(
            "Failed to invalidate | Operation - U",
            {
              cause: error,
            },
          );
        }
        break;

      default: {
        throw new DrizzleStorageError(`Unknown operation: ${op.op}`);
      }
    }
  }
}

export async function finalize<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(
  tx: PgTransaction<TQueryResult, TFullSchema, TSchema>,
  cursor: Cursor,
  indexerId: string,
) {
  try {
    await tx.execute(
      sql.raw(`
      DELETE FROM ${SCHEMA_NAME}.${ROLLBACK_TABLE_NAME}
      WHERE cursor <= ${Number(cursor.orderKey)}
      AND indexer_id = '${indexerId}'
    `),
    );
  } catch (error) {
    throw new DrizzleStorageError("Failed to finalize", {
      cause: error,
    });
  }
}

export async function cleanupStorage<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(
  tx: PgTransaction<TQueryResult, TFullSchema, TSchema>,
  tables: string[],
  indexerId: string,
) {
  try {
    for (const table of tables) {
      await tx.execute(
        sql.raw(
          `DROP TRIGGER IF EXISTS ${getReorgTriggerName(table, indexerId)} ON ${table};`,
        ),
      );
    }

    await tx.execute(
      sql.raw(`
        DELETE FROM ${SCHEMA_NAME}.${ROLLBACK_TABLE_NAME}
        WHERE indexer_id = '${indexerId}'
      `),
    );

    for (const table of tables) {
      try {
        await tx.execute(sql.raw(`TRUNCATE TABLE ${table} CASCADE;`));
      } catch (error) {
        throw new DrizzleStorageError(`Failed to truncate table ${table}`, {
          cause: error,
        });
      }
    }
  } catch (error) {
    throw new DrizzleStorageError("Failed to clean up storage", {
      cause: error,
    });
  }
}
