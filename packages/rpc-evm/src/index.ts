import { RpcClient } from "@apibara/protocol/rpc";
import type { Chain } from "viem";
import { EvmRpcStreamConfig } from "./config";

export * from "./block";
export * from "./filter";
export * from "./config";
export * from "./transform";
export * from "./adaptive-range-fetcher";

export function createEvmRpcClient(
  rpcUrl: string,
  chain?: Chain,
  options?: {
    retryCount?: number;
    retryDelay?: number;
    batch?: boolean;
    initialBatchSize?: bigint;
    minBatchSize?: bigint;
    maxBatchSize?: bigint;
  },
) {
  const config = new EvmRpcStreamConfig(rpcUrl, chain, options);
  return new RpcClient(config);
}
