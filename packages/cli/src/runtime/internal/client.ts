import type { IndexerStreamConfig } from "@apibara/indexer";
import {
  type Client,
  type CreateClientOptions,
  createAuthenticatedClient,
} from "@apibara/protocol";
import { createRpcClient } from "@apibara/protocol/rpc";

export function createRuntimeClient<TFilter, TBlock>({
  streamConfig,
  streamUrl,
  clientOptions,
}: {
  streamConfig: IndexerStreamConfig<TFilter, TBlock>;
  streamUrl?: string;
  clientOptions?: CreateClientOptions;
}): Client<TFilter, TBlock> {
  if ("Request" in streamConfig) {
    if (!streamUrl) {
      throw new Error("streamUrl is required when using a DNA StreamConfig");
    }

    return createAuthenticatedClient(streamConfig, streamUrl, clientOptions);
  }

  return createRpcClient(streamConfig);
}
