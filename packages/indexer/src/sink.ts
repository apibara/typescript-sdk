import type { Cursor, DataFinality } from "@apibara/protocol";
import { EventEmitter } from "eventemitter3";

export interface SinkEvents<TData> {
  write({ data }: { data: TData }): void;
  flush(): void;
}

export type SinkWriteArgs<TData> = {
  data: TData;
  cursor?: Cursor | undefined;
  endCursor?: Cursor | undefined;
  finality: DataFinality;
};

export abstract class Sink<TData> extends EventEmitter<SinkEvents<TData>> {
  abstract write({
    data,
    cursor,
    endCursor,
    finality,
  }: SinkWriteArgs<TData>): Promise<void>;
}

export class DefaultSink<TData = unknown> extends Sink<TData> {
  async write({ data }: SinkWriteArgs<TData>) {
    this.emit("write", { data });
    this.emit("flush");
  }
}

export function defaultSink<TData = unknown>() {
  return new DefaultSink<TData>();
}
