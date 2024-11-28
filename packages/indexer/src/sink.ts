import type { Cursor, DataFinality } from "@apibara/protocol";
import consola from "consola";
import type { IndexerContext } from "./context";

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
  abstract finalize(cursor?: Cursor): Promise<void>;
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

  async finalize(cursor?: Cursor) {
    consola.info(`Finalizing cursor ${cursor?.orderKey}`);
  }
}

/** A default sink that does nothing. */
export function defaultSink() {
  return new DefaultSink();
}

/** Returns the sink for the current indexer. */
export function useSink<TTxnParams>({
  context,
}: {
  context: IndexerContext<TTxnParams>;
}) {
  if (!context.sinkTransaction) {
    throw new Error("Transaction context doesn't exist!");
  }

  return context.sinkTransaction;
}
