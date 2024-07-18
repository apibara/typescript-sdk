import type { Cursor } from "@apibara/protocol";
import type { Database as SqliteDatabase } from "better-sqlite3";
import { Sink, type SinkData, type SinkWriteArgs } from "../sink";

export type SqliteSinkOptions = {
  /**
   * Database instance of better-sqlite3
   */
  database: SqliteDatabase;
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

export class SqliteSink extends Sink {
  private _config: Omit<SqliteSinkOptions, "database">;
  private _db: SqliteDatabase;

  constructor(options: SqliteSinkOptions) {
    super();
    const { database, ...config } = options;
    this._config = config;
    this._db = database;
  }

  async write({ data, endCursor, finality }: SinkWriteArgs) {
    await this.callHook("write", { data });

    data = this.processCursorColumn(data, endCursor);
    await this.insertJsonArray(data);

    await this.callHook("flush", { endCursor, finality });
  }

  private async insertJsonArray(data: SinkData[]) {
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

  private processCursorColumn(
    data: SinkData[],
    endCursor?: Cursor,
  ): SinkData[] {
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

export const sqlite = (args: SqliteSinkOptions) => {
  return new SqliteSink(args);
};
