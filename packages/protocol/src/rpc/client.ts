import type { Client, ClientCallOptions, StreamDataOptions } from "../client";
import type { Cursor } from "../common";
import type { StatusRequest, StatusResponse } from "../status";
import type { StreamDataRequest, StreamDataResponse } from "../stream";
import type { RpcStreamConfig } from "./config";
import { RpcDataStream } from "./data-stream";
import { blockInfoToCursor } from "./helpers";

export class RpcClient<TFilter, TBlock> implements Client<TFilter, TBlock> {
  constructor(private config: RpcStreamConfig<TFilter, TBlock>) {}

  async status(
    _request?: StatusRequest,
    _options?: ClientCallOptions,
  ): Promise<StatusResponse> {
    const [currentHead, finalized] = await Promise.all([
      this.config.fetchCursor({ blockTag: "latest" }),
      this.config.fetchCursor({ blockTag: "finalized" }),
    ]);

    const starting: Cursor = { orderKey: 0n };

    return {
      currentHead: currentHead ? blockInfoToCursor(currentHead) : undefined,
      lastIngested: currentHead ? blockInfoToCursor(currentHead) : undefined,
      finalized: finalized ? blockInfoToCursor(finalized) : undefined,
      starting,
    };
  }

  streamData(
    request: StreamDataRequest<TFilter>,
    options?: StreamDataOptions,
  ): AsyncIterable<StreamDataResponse<TBlock>> {
    let index = 0;
    for (const filter of request.filter) {
      const { valid, error } = this.config.validateFilter(filter);
      if (!valid) {
        throw new Error(`Filter at position ${index} is invalid: ${error}`);
      }

      index += 1;
    }

    return new RpcDataStream(this.config, request, options);
  }
}

export function createRpcClient<TFilter, TBlock>(
  config: RpcStreamConfig<TFilter, TBlock>,
): RpcClient<TFilter, TBlock> {
  return new RpcClient(config);
}
