import type { Cursor } from "@apibara/protocol";
import type {
  FetchBlockResult,
  FinalizedRangeResult,
} from "@apibara/protocol/rpc";
import type { PublicClient } from "viem";
import type { EvmRpcBlock } from "./block";
import type { EvmRpcFilter } from "./filter";
import { fetchLogsForRange } from "./log-fetcher";
import { viemBlockHeaderToDna } from "./transform";

const BLOCK_RANGE_ERROR_PATTERNS = ["invalid block range params"] as const;

export class AdaptiveRangeFetcher {
  private currentBatchSize: bigint;
  private minBatchSize: bigint;
  private maxBatchSize: bigint;
  private client: PublicClient;

  constructor(
    client: PublicClient,
    initialBatchSize = 10n,
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
    filter: EvmRpcFilter,
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
        filter,
      );

      const newSize = this.currentBatchSize * 2n;
      this.currentBatchSize =
        newSize > this.maxBatchSize ? this.maxBatchSize : newSize;

      const blockPromises: Promise<FetchBlockResult<EvmRpcBlock>>[] = [];

      for (let bn = startBlock; bn <= rangeEnd; bn++) {
        const logs = logsByBlock[Number(bn)] || [];
        const shouldFetchHeader = filter.header === "always" || logs.length > 0;

        if (shouldFetchHeader) {
          blockPromises.push(
            this.client
              .getBlock({
                blockNumber: bn,
                includeTransactions: false,
              })
              .then((viemBlock) => {
                const header = viemBlockHeaderToDna(viemBlock);

                const cursor: Cursor | undefined =
                  bn === 0n
                    ? undefined
                    : {
                        orderKey: bn - 1n,
                        uniqueKey: header.parentBlockHash,
                      };

                const endCursor: Cursor = {
                  orderKey: bn,
                  uniqueKey: header.blockHash,
                };

                return {
                  cursor,
                  endCursor,
                  block: {
                    header,
                    logs,
                  },
                };
              }),
          );
        } else {
          // no header needed and no logs either, return null block
          const cursor: Cursor | undefined =
            bn === 0n
              ? undefined
              : {
                  orderKey: bn - 1n,
                  uniqueKey: undefined,
                };

          const endCursor: Cursor = {
            orderKey: bn,
            uniqueKey: undefined,
          };

          blockPromises.push(
            Promise.resolve({
              cursor,
              endCursor,
              block: null,
            }),
          );
        }
      }

      const blocks = await Promise.all(blockPromises);

      const firstCursor = blocks.length > 0 ? blocks[0].endCursor : null;

      const lastCursor =
        blocks.length > 0 ? blocks[blocks.length - 1].endCursor : null;

      return {
        blocks,
        firstCursor,
        lastCursor,
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

        return this.fetchRange(startBlock, endBlock, filter);
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
