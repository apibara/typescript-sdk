import type { Cursor } from "@apibara/protocol";
import type { Database as SqliteDatabase } from "better-sqlite3";
import { Sink, type SinkCursorParams, type SinkData } from "../sink";

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

type TxnContext = {
  buffer: SinkData[];
};

type TxnParams = {
  writer: {
    insert: (data: SinkData[]) => void;
  };
};
const transactionHelper = (context: TxnContext) => {
  return {
    insert: (data: SinkData[]) => {
      context.buffer.push(...data);
    },
  };
};

/**
 * A sink that writes data to a SQLite database.
 *
 * @example
 *
 * ```ts
 * const sink = sqlite({
 *   database: db,
 *   tableName: "test",
 * });
 *
 * ...
 * async transform({context, endCursor}){
 *  const { writer } = useSink(context);
 *  const insertHelper = writer(endCursor);
 *
 *  insertHelper.insert([
 *    { id: 1, name: "John" },
 *    { id: 2, name: "Jane" },
 *  ]);
 * }
 *
 * ```
 */

export class SqliteSink extends Sink {
  private _config: Omit<SqliteSinkOptions, "database">;
  private _db: SqliteDatabase;

  constructor(options: SqliteSinkOptions) {
    super();
    const { database, ...config } = options;
    this._config = config;
    this._db = database;
  }

  private async write({
    data,
    endCursor,
  }: { data: SinkData[]; endCursor?: Cursor }) {
    data = this.processCursorColumn(data, endCursor);
    await this.insertJsonArray(data);
  }

  async transaction(
    { cursor, endCursor, finality }: SinkCursorParams,
    cb: (params: TxnParams) => Promise<void>,
  ) {
    const context: TxnContext = {
      buffer: [],
    };

    const writer = transactionHelper(context);

    await cb({ writer });
    await this.write({ data: context.buffer, endCursor });
  }

  async invalidateOnRestart(cursor?: Cursor) {
    await this.invalidate(cursor);
  }

  async invalidate(cursor?: Cursor) {
    const cursorValue = Number(cursor?.orderKey);

    const sql = `DELETE FROM ${this._config.tableName} WHERE ${this._config.cursorColumn ?? "_cursor"} > ?`;
    this._db.prepare(sql).run(cursorValue);
  }

  async finalize(cursor?: Cursor) {
    // TODO: Implement
    throw new Error("Not implemented");
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
