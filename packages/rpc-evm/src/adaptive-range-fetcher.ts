import type { Cursor } from "@apibara/protocol";
import type { FinalizedRangeResult } from "@apibara/protocol/rpc";
import type { PublicClient } from "viem";
import type { EvmRpcBlock } from "./block";
import type { EvmRpcFilter } from "./filter";
import { fetchLogsForRange } from "./log-fetcher";
import { viemBlockHeaderToDna } from "./transform";

const BLOCK_RANGE_ERROR_PATTERNS = [
  "invalid block range params",
  "block range",
  "query returned more than",
  "exceeds max",
  "too many results",
  "response size exceeded",
  "log response size exceeded",
  "result window",
  "limit exceeded",
] as const;

export class AdaptiveRangeFetcher {
  private currentBatchSize: bigint;
  private minBatchSize: bigint;
  private maxBatchSize: bigint;
  private client: PublicClient;

  constructor(
    client: PublicClient,
    initialBatchSize = 100n,
    minBatchSize = 1n,
    maxBatchSize = 1000n,
  ) {
    this.client = client;
    this.currentBatchSize = initialBatchSize;
    this.minBatchSize = minBatchSize;
    this.maxBatchSize = maxBatchSize;
  }

  async fetchRange(
    startBlock: bigint,
    endBlock: bigint,
    filters: EvmRpcFilter[],
  ): Promise<FinalizedRangeResult<EvmRpcBlock>> {
    const rangeEnd =
      startBlock + this.currentBatchSize - 1n < endBlock
        ? startBlock + this.currentBatchSize - 1n
        : endBlock;

    try {
      const logsByBlock = await fetchLogsForRange(
        this.client,
        startBlock,
        rangeEnd,
        filters,
      );

      const newSize = this.currentBatchSize * 2n;
      this.currentBatchSize =
        newSize > this.maxBatchSize ? this.maxBatchSize : newSize;

      const blockPromises = [];
      for (let bn = startBlock; bn <= rangeEnd; bn++) {
        blockPromises.push(
          this.client
            .getBlock({
              blockNumber: bn,
              includeTransactions: false,
            })
            .then((viemBlock) => ({
              blockNumber: bn,
              logs: logsByBlock[Number(bn)] || [],
              viemBlock,
            })),
        );
      }

      const blockResults = await Promise.all(blockPromises);
      const blocks = blockResults.map(({ viemBlock, logs }) => ({
        header: viemBlockHeaderToDna(viemBlock),
        logs,
      }));

      // TODO: check
      const startCursor: Cursor =
        blocks.length > 0 && startBlock > 0n
          ? {
              orderKey: blocks[0].header.blockNumber,
              uniqueKey: blocks[0].header.blockHash,
            }
          : { orderKey: -1n };

      // TODO: check
      const endCursor: Cursor =
        blocks.length > 0
          ? {
              orderKey: blocks[blocks.length - 1].header.blockNumber,
              uniqueKey: blocks[blocks.length - 1].header.blockHash,
            }
          : { orderKey: -1n };

      return {
        blocks,
        startCursor,
        endCursor,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (this.isBlockRangeError(error)) {
        if (this.currentBatchSize === this.minBatchSize) {
          throw new Error(
            `Failed to fetch range ${startBlock}-${rangeEnd} with minimum batch size ${this.minBatchSize}: ${errorMessage}`,
          );
        }

        const newSize = this.currentBatchSize / 2n;
        this.currentBatchSize =
          newSize < this.minBatchSize ? this.minBatchSize : newSize;

        return this.fetchRange(startBlock, endBlock, filters);
      }

      throw error;
    }
  }

  private isBlockRangeError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return BLOCK_RANGE_ERROR_PATTERNS.some((pattern) =>
        message.includes(pattern),
      );
    }
    return false;
  }
}
