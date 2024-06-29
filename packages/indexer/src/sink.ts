import type { Cursor, DataFinality } from "@apibara/protocol";
import { Hookable } from "hookable";

export interface SinkEvents<TData> {
  write({ data }: { data: TData[] }): void;
  flush({
    endCursor,
    finality,
  }: { endCursor?: Cursor; finality: DataFinality }): void;
}

export type SinkWriteArgs<TData> = {
  data: TData[];
  cursor?: Cursor | undefined;
  endCursor?: Cursor | undefined;
  finality: DataFinality;
};

export abstract class Sink<TData> extends Hookable<SinkEvents<TData>> {
  abstract write({
    data,
    cursor,
    endCursor,
    finality,
  }: SinkWriteArgs<TData>): Promise<void>;
}

export class DefaultSink<TData = unknown> extends Sink<TData> {
  async write({ data, endCursor, finality }: SinkWriteArgs<TData>) {
    await this.callHook("write", { data });
    await this.callHook("flush", { endCursor, finality });
  }
}

export function defaultSink<TData = unknown>() {
  return new DefaultSink<TData>();
}
