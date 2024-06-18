import type { Cursor } from "@apibara/protocol";
import { Sink, type SinkWriteArgs } from "../sink";
import { type Stringifier, stringify, type Options } from "csv-stringify";
import fs from "node:fs";

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

class CsvSink<TData extends Record<string, unknown>> extends Sink<TData> {
  constructor(
    private _stringifier: Stringifier,
    private _config: CsvSinkOptions,
  ) {
    super();
  }

  async write({ data, endCursor }: SinkWriteArgs<TData>) {
    this.emit("write", { data });
    // adds a "_cursor" property if "cursorColumn" is not specified by user
    data = this.processCursorColumn(data, endCursor);
    // Insert the data into csv
    await this.insertToCSV(data);

    this.emit("flush");
  }

  private async insertToCSV(data: TData[]) {
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
}

export const csv = (args: CsvArgs & CsvSinkOptions) => {
  const { csvOptions, filepath, ...sinkOptions } = args;
  const stringifier = stringify({ ...csvOptions });

  const writeStream = fs.createWriteStream(filepath, { flags: "a" });
  stringifier.pipe(writeStream);
  return new CsvSink(stringifier, sinkOptions);
};
