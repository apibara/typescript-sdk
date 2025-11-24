import { RpcClient } from "@apibara/protocol/rpc";
import type { Chain } from "viem";
import { EvmRpcStreamConfig, type EvmRpcStreamConfigOptions } from "./config";

export * from "./block";
export * from "./filter";
export * from "./config";
export * from "./transform";
export * from "./adaptive-range-fetcher";

export function createEvmRpcClient(
  rpcUrl: string,
  chain?: Chain,
  options?: EvmRpcStreamConfigOptions,
) {
  const config = new EvmRpcStreamConfig(rpcUrl, chain, options);
  return new RpcClient(config);
}
