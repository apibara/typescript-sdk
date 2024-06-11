import type { Database } from "sqlite3";
import sqlite3 from "sqlite3";
import { Sink, type SinkWriteArgs } from "../sink";

export type SqliteSinkOptions = {
  /**
   * The file path to the SQLite database.
   */
  dbPath: string;
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

class SqliteSink<TData = unknown> extends Sink<TData> {
  private _config: SqliteSinkOptions;
  private _db?: Database;

  constructor(config: SqliteSinkOptions) {
    super();
    this._config = config;
    this.init();
  }

  async write({ data, endCursor }: SinkWriteArgs<TData>) {
    this.emit("write", { data });

    if (!Array.isArray(data) || data === null) {
      throw new Error("Data is not an array or is null");
    }

    const cursorColumn = this._config.cursorColumn;

    // If user specifies cursorColumn
    if (cursorColumn) {
      // Validate cursorColumn value against endCursor.orderKey
      if (data.some((row) => row[cursorColumn] !== endCursor?.orderKey)) {
        throw new Error(
          `The ${cursorColumn} value must be equal to endCursor.orderKey: (${endCursor?.orderKey})`,
        );
      }
    } else if (endCursor) {
      // add _cursor property with value "endCursor.orderKey"
      data = data.map((row) => ({
        ...row,
        _cursor: Number(endCursor.orderKey),
      })) as TData;
    }

    await this.insertJsonArray(data);

    this.emit("flush");
  }

  private init() {
    this._db = new sqlite3.Database(this._config.dbPath, (err) => {
      if (err) {
        throw new Error(err.message);
      }
    });
  }

  private async insertJsonArray(data: TData) {
    if (!this._db || this._db === undefined) {
      throw new Error("SQlite database is not initialized");
    }

    if (!Array.isArray(data) || data === null) {
      throw new Error("Data is not an array or is null");
    }

    if (data.length === 0) return;

    // Get columns from the first row of the object array
    const columns = Object.keys(data[0]);
    const columnNames = columns.join(", ");
    const placeholders = columns.map(() => "?").join(", ");

    // Handle onConflict option
    const { on, update } = this._config.onConflict || {};
    let conflictClause = "";
    if (on && update && update.length > 0) {
      const updateColumns = update
        .map((col) => `${col}=excluded.${col}`)
        .join(", ");
      conflictClause = ` ON CONFLICT(${on}) DO UPDATE SET ${updateColumns}`;
    }

    // Build the SQL insert statement with multiple rows
    const insertSQL = `INSERT INTO ${this._config.tableName} (${columnNames}) VALUES `;
    const valuePlaceholders = data.map(() => `(${placeholders})`).join(", ");
    const statement = insertSQL + valuePlaceholders + conflictClause;

    // Prepare and execute the SQL statement
    const values = data.flatMap((row) => columns.map((col) => row[col]));

    await new Promise<void>((resolve, reject) => {
      this._db?.run(statement, values, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export const sqlite = (options: SqliteSinkOptions) => new SqliteSink(options);
