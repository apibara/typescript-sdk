import type { Cursor } from "@apibara/protocol";
import type {
  ExtractTablesWithRelations,
  TablesRelationalConfig,
} from "drizzle-orm";
import type {
  PgDatabase,
  PgQueryResultHKT,
  PgTransaction,
} from "drizzle-orm/pg-core";

export async function initializeReorgRollbackTable<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(tx: PgTransaction<TQueryResult, TFullSchema, TSchema>) {
  // Create the audit log table
  await tx.execute(`
    CREATE TABLE IF NOT EXISTS __reorg_rollback(
      n SERIAL PRIMARY KEY,
      op CHAR(1) NOT NULL,
      table_name TEXT NOT NULL,
      cursor INTEGER NOT NULL,
      row_id TEXT,
      row_value JSONB
    );
  `);

  // Create the trigger function
  await tx.execute(`
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
  `);
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
  for (const table of tables) {
    await tx.execute(`
      DROP TRIGGER IF EXISTS ${table}_reorg ON ${table};
      CREATE CONSTRAINT TRIGGER ${table}_reorg
      AFTER INSERT OR UPDATE OR DELETE ON ${table}
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW EXECUTE FUNCTION reorg_checkpoint('${idColumn}', ${Number(endCursor.orderKey)});
    `);
  }
}

export async function removeTriggers<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(db: PgDatabase<TQueryResult, TFullSchema, TSchema>, tables: string[]) {
  for (const table of tables) {
    await db.execute(`DROP TRIGGER IF EXISTS ${table}_reorg ON ${table};`);
  }
}
