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
  private _config: CsvSinkOptions;
  private _stringifier: Stringifier;

  constructor(stringifier: Stringifier, config: CsvSinkOptions) {
    super();
    this._config = config;
    this._stringifier = stringifier;
  }

  async write({ data, endCursor }: SinkWriteArgs<TData>) {
    this.emit("write", { data });

    data = this.processCursorColumn(data, endCursor);
    await this.insertToCSV(data);

    this.emit("flush");
  }

  private async insertToCSV(data: TData[]) {
    if (data.length === 0) return;
    for (const row of data) {
      this._stringifier.write(row);
    }
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

    return cursorColumn
      ? data
      : (data.map((row) => ({
          ...row,
          _cursor: Number(endCursor?.orderKey),
        })) as TData[]);
  }
}

export const csv = async (args: CsvArgs & CsvSinkOptions) => {
  const { csvOptions, filepath, ...sinkOptions } = args;
  const stringifier = stringify({ ...csvOptions });

  const writeStream = fs.createWriteStream(filepath, { flags: "a" });
  stringifier.pipe(writeStream);
  return new CsvSink(stringifier, sinkOptions);
};
