import type { Bytes, Cursor } from "@apibara/protocol";
import {
  type BlockInfo,
  type FinalizedRangeResult,
  RpcStreamConfig,
} from "@apibara/protocol/rpc";
import {
  http,
  type HttpTransportConfig,
  type PublicClient,
  createPublicClient,
} from "viem";
import { type Chain, mainnet } from "viem/chains";
import { AdaptiveRangeFetcher } from "./adaptive-range-fetcher";
import type { EvmRpcBlock } from "./block";
import { type EvmRpcFilter, validateEvmRpcFilter } from "./filter";
import { fetchLogsForBlock } from "./log-fetcher";
import { viemBlockHeaderToDna } from "./transform";

export type EvmRpcStreamConfigOptions = {
  dynamicBatching?: {
    initialBatchSize?: bigint;
    minBatchSize?: bigint;
    maxBatchSize?: bigint;
  };
  clientConfig?: HttpTransportConfig;
};

export class EvmRpcStreamConfig extends RpcStreamConfig<
  EvmRpcFilter,
  EvmRpcBlock
> {
  private client: PublicClient;
  private adaptiveFetcher: AdaptiveRangeFetcher;

  constructor(
    rpcUrl: string,
    chain?: Chain,
    options?: EvmRpcStreamConfigOptions,
  ) {
    super();

    this.client = createPublicClient({
      chain: chain ?? mainnet,
      transport: http(rpcUrl, {
        batch: {
          batchSize: 1000,
          wait: 50,
        },
        retryCount: 5,
        retryDelay: 3000,
        ...(options?.clientConfig ?? {}),
      }),
    });

    this.adaptiveFetcher = new AdaptiveRangeFetcher(
      this.client,
      options?.dynamicBatching?.initialBatchSize,
      options?.dynamicBatching?.minBatchSize,
      options?.dynamicBatching?.maxBatchSize,
    );
  }

  validateFilter(filter: EvmRpcFilter): void {
    validateEvmRpcFilter(filter);
  }

  async getCursor(finality: "head" | "finalized"): Promise<Cursor> {
    const blockTag = finality === "head" ? "latest" : "finalized";

    const block = await this.client.getBlock({
      blockTag,
      includeTransactions: false,
    });

    if (!block.number || !block.hash) {
      throw new Error(`Failed to get ${finality} block`);
    }

    return {
      orderKey: block.number,
      uniqueKey: block.hash,
    };
  }

  async getBlockInfo(blockNumber: bigint): Promise<BlockInfo> {
    const block = await this.client.getBlock({
      blockNumber,
      includeTransactions: false,
    });

    if (!block.number || !block.hash) {
      throw new Error(`Block ${blockNumber} not found`);
    }

    return {
      blockNumber: block.number,
      blockHash: block.hash,
      parentHash: block.parentHash,
    };
  }

  async fetchFinalizedRange(
    startBlock: bigint,
    endBlock: bigint,
    filters: EvmRpcFilter[],
  ): Promise<FinalizedRangeResult<EvmRpcBlock>> {
    return await this.adaptiveFetcher.fetchRange(startBlock, endBlock, filters);
  }

  async fetchBlock(
    blockNumber: bigint,
    filters: EvmRpcFilter[],
  ): Promise<EvmRpcBlock | null> {
    const viemBlock = await this.client.getBlock({
      blockNumber,
      includeTransactions: false,
    });

    if (!viemBlock.number || !viemBlock.hash) {
      return null;
    }

    const logs = await fetchLogsForBlock(this.client, blockNumber, filters);

    return {
      header: viemBlockHeaderToDna(viemBlock),
      logs,
    };
  }

  async verifyBlock(blockNumber: bigint, blockHash: Bytes): Promise<boolean> {
    try {
      const block = await this.client.getBlock({
        blockNumber,
        includeTransactions: false,
      });

      return block.hash === blockHash;
    } catch {
      return false;
    }
  }
}
