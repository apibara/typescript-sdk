import type { Cursor } from "@apibara/protocol";
import Database, { type Database as SqliteDatabase } from "better-sqlite3";
import { Sink, type SinkWriteArgs } from "../sink";

export type SqliteArgs = Database.Options & {
  filename: string | Buffer | undefined;
};

export type SqliteSinkOptions = {
  /**
   * The name of the table where data will be inserted.
   */
  tableName: string;
  /**
   * An optional column name used to store the cursor value. If specified,
   * the value of this column must match the `endCursor.orderKey` for each row.
   */
  cursorColumn?: string;
  /**
   * An optional configuration to handle conflicts during data insertion.
   * - `on`: The column name on which conflicts are detected.
   * - `update`: An array of column names to be updated if a conflict occurs.
   */
  onConflict?: { on: string; update: string[] };
};

export class SqliteSink<
  TData extends Record<string, unknown>,
> extends Sink<TData> {
  private _config: SqliteSinkOptions;
  private _db: SqliteDatabase;

  constructor(db: SqliteDatabase, config: SqliteSinkOptions) {
    super();
    this._config = config;
    this._db = db;
  }

  async write({ data, endCursor, finality }: SinkWriteArgs<TData>) {
    await this.callHook("write", { data });

    data = this.processCursorColumn(data, endCursor);
    await this.insertJsonArray(data);

    await this.callHook("flush", { endCursor, finality });
  }

  private async insertJsonArray(data: TData[]) {
    if (data.length === 0) return;

    // Get columns from the first row of the object array
    const columns = Object.keys(data[0]);
    const columnNames = columns.join(", ");
    const placeholders = columns.map(() => "?").join(", ");

    // Handle onConflict option
    const conflictClause = this.buildConflictClause();

    // Build the SQL insert statement with multiple rows
    const insertSQL = `INSERT INTO ${this._config.tableName} (${columnNames}) VALUES `;
    const valuePlaceholders = data.map(() => `(${placeholders})`).join(", ");
    const statement = insertSQL + valuePlaceholders + conflictClause;

    // Prepare and execute the SQL statement
    const values = data.flatMap((row) => columns.map((col) => row[col]));

    this._db.prepare(statement).run(values);
  }

  private processCursorColumn(data: TData[], endCursor?: Cursor): TData[] {
    const { cursorColumn } = this._config;

    if (
      cursorColumn &&
      data.some(
        (row) => Number(row[cursorColumn]) !== Number(endCursor?.orderKey),
      )
    ) {
      throw new Error(
        `Mismatch of ${cursorColumn} and Cursor ${Number(endCursor?.orderKey)}`,
      );
    }

    if (cursorColumn) {
      return data;
    }

    return data.map((row) => ({
      ...row,
      _cursor: Number(endCursor?.orderKey),
    }));
  }

  private buildConflictClause(): string {
    const { on, update } = this._config.onConflict || {};
    if (on && update && update.length > 0) {
      const updateColumns = update
        .map((col) => `${col}=excluded.${col}`)
        .join(", ");
      return ` ON CONFLICT(${on}) DO UPDATE SET ${updateColumns}`;
    }
    return "";
  }
}

export const sqlite = <TData extends Record<string, unknown>>(
  args: SqliteArgs & SqliteSinkOptions,
) => {
  const { filename, cursorColumn, tableName, onConflict, ...sqliteOptions } =
    args;
  const db = new Database(filename, sqliteOptions);
  // For performance reason: https://github.com/WiseLibs/better-sqlite3/blob/master/docs/performance.md
  db.pragma("journal_mode = WAL");

  return new SqliteSink<TData>(db, { tableName, cursorColumn, onConflict });
};
