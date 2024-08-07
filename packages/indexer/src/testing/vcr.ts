import { Sink, type SinkWriteArgs } from "../sink";
import type { VcrReplayResult } from "../vcr";

export class VcrSink extends Sink {
  public result: VcrReplayResult["outputs"] = [];

  async write({ data, endCursor, finality }: SinkWriteArgs) {
    await this.callHook("write", { data });
    this.result.push({ data, endCursor });
    await this.callHook("flush", { endCursor, finality });
  }
}

export function vcr() {
  return new VcrSink();
}
