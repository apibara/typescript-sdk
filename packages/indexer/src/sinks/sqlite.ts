import type { Cursor } from "@apibara/protocol";
import { type Database, type ISqlite, open } from "sqlite";
import { Sink, type SinkWriteArgs } from "../sink";

export type SqliteArgs = ISqlite.Config;

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
  private _db: Database;

  constructor(db: Database, config: SqliteSinkOptions) {
    super();
    this._config = config;
    this._db = db;
  }

  async write({ data, endCursor }: SinkWriteArgs<TData>) {
    this.emit("write", { data });

    data = this.processCursorColumn(data, endCursor);
    await this.insertJsonArray(data);

    this.emit("flush");
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

    await this._db.run(statement, values);
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

export const sqlite = async (args: SqliteArgs & SqliteSinkOptions) => {
  const { filename, mode, driver, ...sinkOptions } = args;
  const db = await open({ filename, mode, driver });
  return new SqliteSink(db, sinkOptions);
};
