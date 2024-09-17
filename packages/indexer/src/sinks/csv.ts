import fs from "node:fs";
import type { Cursor } from "@apibara/protocol";
import { type Options, type Stringifier, stringify } from "csv-stringify";
import { Sink, type SinkCursorParams, type SinkData } from "../sink";

export type CsvArgs = {
  /**
   * csv-stringy options
   * @reference https://csv.js.org/stringify/options/
   */
  csvOptions?: Options;
  /**
   * filepath for your csv file
   */
  filepath: string;
};

export type CsvSinkOptions = {
  /**
   * An optional column name used to store the cursor value. If specified,
   * the value of this column must match the `endCursor.orderKey` for each row.
   */
  cursorColumn?: string;
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
 * A sink that writes data to a CSV file.
 *
 * @example
 *
 * ```ts
 * const sink = csv({
 *   filepath: "./data.csv",
 *   csvOptions: {
 *     header: true,
 *   },
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
export class CsvSink extends Sink {
  constructor(
    private _stringifier: Stringifier,
    private _config: CsvSinkOptions,
  ) {
    super();
  }

  private async write({
    data,
    endCursor,
  }: { data: SinkData[]; endCursor?: Cursor }) {
    // adds a "_cursor" property if "cursorColumn" is not specified by user
    data = this.processCursorColumn(data, endCursor);
    // Insert the data into csv
    await this.insertToCSV(data);
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

  async invalidate(cursor?: Cursor) {
    // TODO: Implement
    throw new Error("Not implemented");
  }

  private async insertToCSV(data: SinkData[]) {
    if (data.length === 0) return;

    return await new Promise<void>((resolve, reject) => {
      for (const row of data) {
        this._stringifier.write(row, (err) => {
          if (err) throw new Error(err.message);

          // resolve when all rows are inserted into csv
          if (row === data[data.length - 1]) {
            resolve();
          }
        });
      }
    });
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
}

export const csv = (args: CsvArgs & CsvSinkOptions) => {
  const { csvOptions, filepath, ...sinkOptions } = args;
  const stringifier = stringify({ ...csvOptions });

  const writeStream = fs.createWriteStream(filepath, { flags: "a" });
  stringifier.pipe(writeStream);
  return new CsvSink(stringifier, sinkOptions);
};
