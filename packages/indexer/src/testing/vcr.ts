import { Sink, type SinkWriteArgs } from "../sink";
import type { VcrReplayResult } from "../vcr";

export class VcrSink<TData> extends Sink<TData> {
  public result: VcrReplayResult<TData>["outputs"] = [];

  async write({ data, endCursor }: SinkWriteArgs<TData>) {
    await this.callHook("write", { data });
    this.result.push({ data, endCursor });
    await this.callHook("flush");
  }
}

export function vcr<TData>() {
  return new VcrSink<TData>();
}
