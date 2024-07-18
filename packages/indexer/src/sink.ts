import type { Cursor, DataFinality } from "@apibara/protocol";
import { Hookable } from "hookable";

export type SinkData = Record<string, unknown>;

export interface SinkEvents {
  write({ data }: { data: SinkData[] }): void;
  flush({
    endCursor,
    finality,
  }: { endCursor?: Cursor; finality: DataFinality }): void;
}

export type SinkWriteArgs = {
  data: SinkData[];
  cursor?: Cursor | undefined;
  endCursor?: Cursor | undefined;
  finality: DataFinality;
};

export abstract class Sink extends Hookable<SinkEvents> {
  abstract write({
    data,
    cursor,
    endCursor,
    finality,
  }: SinkWriteArgs): Promise<void>;
}

export class DefaultSink extends Sink {
  async write({ data, endCursor, finality }: SinkWriteArgs) {
    await this.callHook("write", { data });
    await this.callHook("flush", { endCursor, finality });
  }
}

export function defaultSink() {
  return new DefaultSink();
}
