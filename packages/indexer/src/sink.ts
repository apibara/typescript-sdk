import type { Cursor, DataFinality } from "@apibara/protocol";
import consola from "consola";

export type SinkData = Record<string, unknown>;

export type SinkCursorParams = {
  cursor?: Cursor;
  endCursor?: Cursor;
  finality: DataFinality;
};

export abstract class Sink<TTxnParams = unknown> {
  abstract transaction(
    { cursor, endCursor, finality }: SinkCursorParams,
    cb: (params: TTxnParams) => Promise<void>,
  ): Promise<void>;

  abstract invalidate(cursor?: Cursor): Promise<void>;
}

export class DefaultSink extends Sink<unknown> {
  async transaction(
    { cursor, endCursor, finality }: SinkCursorParams,
    cb: (params: unknown) => Promise<void>,
  ): Promise<void> {
    await cb({});
  }

  async invalidate(cursor?: Cursor) {
    consola.info(`Invalidating cursor ${cursor?.orderKey}`);
  }
}

export function defaultSink() {
  return new DefaultSink();
}
