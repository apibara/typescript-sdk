import { EventEmitter } from "eventemitter3";

export interface SinkEvents<TData> {
  write({ data }: { data: TData }): void;
  flush(): void;
}

export abstract class Sink<TData> extends EventEmitter<SinkEvents<TData>> {
  abstract write({ data }: { data: TData }): Promise<void>;
}

export class DefaultSink<TData = unknown> extends Sink<TData> {
  async write({ data }: { data: TData }) {
    this.emit("write", { data });
    this.emit("flush");
  }
}

export function defaultSink<TData = unknown>() {
  return new DefaultSink<TData>();
}
