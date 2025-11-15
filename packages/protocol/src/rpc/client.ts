import type { Client, ClientCallOptions, StreamDataOptions } from "../client";
import type { Cursor } from "../common";
import type { StatusRequest, StatusResponse } from "../status";
import type { StreamDataRequest, StreamDataResponse } from "../stream";
import type { RpcStreamConfig } from "./config";
import { StreamLoop } from "./loop";

export class RpcClient<TFilter, TBlock> implements Client<TFilter, TBlock> {
  constructor(private config: RpcStreamConfig<TFilter, TBlock>) {}

  async status(
    _request?: StatusRequest,
    _options?: ClientCallOptions,
  ): Promise<StatusResponse> {
    const [currentHead, finalized] = await Promise.all([
      this.config.getCursor("head"),
      this.config.getCursor("finalized"),
    ]);

    const starting: Cursor = { orderKey: 0n };

    return {
      currentHead,
      lastIngested: currentHead,
      finalized,
      starting,
    };
  }

  streamData(
    request: StreamDataRequest<TFilter>,
    options?: StreamDataOptions,
  ): AsyncIterable<StreamDataResponse<TBlock>> {
    for (const filter of request.filter) {
      this.config.validateFilter(filter);
    }

    return new StreamLoop(this.config, request, options);
  }
}

export function createRpcClient<TFilter, TBlock>(
  config: RpcStreamConfig<TFilter, TBlock>,
): RpcClient<TFilter, TBlock> {
  return new RpcClient(config);
}
