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
  pgTable,
  serial,
  text,
} from "drizzle-orm/pg-core";
import { DrizzleStorageError } from "./utils";
export type ReorgOperation = "I" | "U" | "D";

export const reorgRollbackTable = pgTable("__reorg_rollback", {
  n: serial("n").primaryKey(),
  op: char("op", { length: 1 }).$type<ReorgOperation>().notNull(),
  table_name: text("table_name").notNull(),
  cursor: integer("cursor").notNull(),
  row_id: text("row_id"),
  row_value: jsonb("row_value"),
});

export type ReorgRollbackRow = typeof reorgRollbackTable.$inferSelect;

export async function initializeReorgRollbackTable<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(tx: PgTransaction<TQueryResult, TFullSchema, TSchema>) {
  try {
    // Create the audit log table
    await tx.execute(
      sql.raw(`
        CREATE TABLE IF NOT EXISTS __reorg_rollback(
          n SERIAL PRIMARY KEY,
          op CHAR(1) NOT NULL,
          table_name TEXT NOT NULL,
          cursor INTEGER NOT NULL,
          row_id TEXT,
          row_value JSONB
        );
      `),
    );

    // Create the trigger function
    await tx.execute(
      sql.raw(`
        CREATE OR REPLACE FUNCTION reorg_checkpoint()
        RETURNS TRIGGER AS $$
        DECLARE
          id_col TEXT := TG_ARGV[0]::TEXT;
          order_key INTEGER := TG_ARGV[1]::INTEGER;
          new_id_value TEXT := row_to_json(NEW.*)->>id_col;
          old_id_value TEXT := row_to_json(OLD.*)->>id_col;
        BEGIN
          IF (TG_OP = 'DELETE') THEN
            INSERT INTO __reorg_rollback(op, table_name, cursor, row_id, row_value)
              SELECT 'D', TG_TABLE_NAME, order_key, old_id_value, row_to_json(OLD.*);
          ELSIF (TG_OP = 'UPDATE') THEN
            INSERT INTO __reorg_rollback(op, table_name, cursor, row_id, row_value)
              SELECT 'U', TG_TABLE_NAME, order_key, new_id_value, row_to_json(OLD.*);
          ELSIF (TG_OP = 'INSERT') THEN
            INSERT INTO __reorg_rollback(op, table_name, cursor, row_id, row_value)
              SELECT 'I', TG_TABLE_NAME, order_key, new_id_value, null;
          END IF;
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
      `),
    );
  } catch (error) {
    console.error(error);
    throw new DrizzleStorageError(
      `Failed to initialize reorg rollback table: ${error}`,
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
  idColumn: string,
) {
  try {
    for (const table of tables) {
      await tx.execute(
        sql.raw(`DROP TRIGGER IF EXISTS ${table}_reorg ON ${table};`),
      );
      await tx.execute(
        sql.raw(`
          CREATE CONSTRAINT TRIGGER ${table}_reorg
          AFTER INSERT OR UPDATE OR DELETE ON ${table}
          DEFERRABLE INITIALLY DEFERRED
          FOR EACH ROW EXECUTE FUNCTION reorg_checkpoint('${idColumn}', ${`${Number(endCursor.orderKey)}`});
        `),
      );
    }
  } catch (error) {
    console.error(error);
    throw new DrizzleStorageError(`Failed to register triggers: ${error}`);
  }
}

export async function removeTriggers<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(db: PgDatabase<TQueryResult, TFullSchema, TSchema>, tables: string[]) {
  try {
    for (const table of tables) {
      await db.execute(
        sql.raw(`DROP TRIGGER IF EXISTS ${table}_reorg ON ${table};`),
      );
    }
  } catch (error) {
    console.error(error);
    throw new DrizzleStorageError(`Failed to remove triggers: ${error}`);
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
  idColumn: string,
) {
  // Get and delete operations after cursor in one query, ordered by newest first
  const { rows: result } = (await tx.execute(
    sql.raw(`
      WITH deleted AS (
        DELETE FROM __reorg_rollback
        WHERE cursor > ${Number(cursor.orderKey)}
        RETURNING *
      )
      SELECT * FROM deleted ORDER BY n DESC;
    `),
  )) as { rows: ReorgRollbackRow[] };

  if (!Array.isArray(result)) {
    throw new Error("Invalid result format from reorg_rollback query");
  }

  // Process each operation in reverse order
  for (const op of result) {
    switch (op.op) {
      case "I":
        try {
          // For inserts, delete the row
          if (op.row_id) {
            await tx.execute(
              sql.raw(`
                DELETE FROM ${op.table_name}
                WHERE ${idColumn} = '${op.row_id}'
              `),
            );
          }
        } catch (error) {
          console.error(error);
          throw new DrizzleStorageError(
            `Failed to invalidate | Operation - I : ${error}`,
          );
        }

        break;

      case "D":
        try {
          // For deletes, reinsert the row using json_populate_record
          if (op.row_value) {
            await tx.execute(
              sql.raw(`
                INSERT INTO ${op.table_name}
                SELECT * FROM json_populate_record(null::${op.table_name}, '${JSON.stringify(op.row_value)}'::json)
              `),
            );
          }
        } catch (error) {
          console.error(error);
          throw new DrizzleStorageError(
            `Failed to invalidate | Operation - D : ${error}`,
          );
        }

        break;

      case "U":
        try {
          // For updates, restore previous values
          if (op.row_value && op.row_id) {
            const rowValue =
              typeof op.row_value === "string"
                ? JSON.parse(op.row_value)
                : op.row_value;

            const nonIdKeys = Object.keys(rowValue).filter(
              (k) => k !== idColumn,
            );

            const fields = nonIdKeys.map((c) => `${c} = prev.${c}`).join(", ");

            const query = sql.raw(`
              UPDATE ${op.table_name}
              SET ${fields}
              FROM (
                SELECT * FROM json_populate_record(null::${op.table_name}, '${JSON.stringify(op.row_value)}'::json)
              ) as prev
              WHERE ${op.table_name}.${idColumn} = '${op.row_id}'
              `);

            await tx.execute(query);
          }
        } catch (error) {
          console.error(error);
          throw new DrizzleStorageError(
            `Failed to invalidate | Operation - U : ${error}`,
          );
        }
        break;
    }
  }
}

export async function finalize<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(tx: PgTransaction<TQueryResult, TFullSchema, TSchema>, cursor: Cursor) {
  try {
    await tx.execute(
      sql.raw(`
      DELETE FROM __reorg_rollback
      WHERE cursor <= ${Number(cursor.orderKey)}
    `),
    );
  } catch (error) {
    console.error(error);
    throw new DrizzleStorageError(`Failed to finalize: ${error}`);
  }
}
