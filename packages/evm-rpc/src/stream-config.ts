import type { Bytes } from "@apibara/protocol";
import {
  type BlockInfo,
  type FetchBlockByHashArgs,
  type FetchBlockByHashResult,
  type FetchBlockRangeArgs,
  type FetchBlockRangeResult,
  type FetchBlockResult,
  type FetchCursorArgs,
  type FetchCursorRangeArgs,
  RpcStreamConfig,
  type ValidateFilterResult,
} from "@apibara/protocol/rpc";
import {
  type EIP1193Parameters,
  type PublicRpcSchema,
  type RpcBlock,
  formatBlock,
  numberToHex,
  toHex,
} from "viem";
import type { Block, Log } from "./block";
import { type Filter, validateFilter } from "./filter";
import { fetchLogsForRange } from "./log-fetcher";
import { createTracer } from "./otel";
import { type BlockRangeOracle, createBlockRangeOracle } from "./range-oracle";
import { retry } from "./retry";
import { rpcBlockHeaderToDna } from "./transform";

const tracer = createTracer();

export type RequestParameters = EIP1193Parameters<PublicRpcSchema>;

export type RequestReturnType<method extends RequestParameters["method"]> =
  Extract<PublicRpcSchema[number], { Method: method }>["ReturnType"];

// Require just the bare minimum from the provided viem client.
export type ViemRpcClient = {
  request: <TParams extends RequestParameters>(
    params: TParams,
  ) => Promise<RequestReturnType<TParams["method"]>>;
};

export type EvmRpcStreamOptions = {
  /** How many blocks to fetch in a single eth_getLogs call. */
  getLogsRangeSize?: bigint;
  /** How often to refresh the head block. */
  headRefreshIntervalMs?: number;
  /** How often to refresh the finalized block. */
  finalizedRefreshIntervalMs?: number;
  /** Force sending accepted headers even if no data matched. */
  alwaysSendAcceptedHeaders?: boolean;
  /** Merge multiple `eth_getLogs` calls into a single one, filtering data on the client. */
  mergeGetLogsFilter?: "always" | "accepted" | false;
};

export class EvmRpcStream extends RpcStreamConfig<Filter, Block> {
  private blockRangeOracle: BlockRangeOracle;

  constructor(
    private client: ViemRpcClient,
    private options: EvmRpcStreamOptions = {},
  ) {
    super();

    this.blockRangeOracle = createBlockRangeOracle({
      startingSize: options.getLogsRangeSize ?? 1_000n,
      // Use the provided size to limit the maximum range size
      maxSize: options.getLogsRangeSize ? options.getLogsRangeSize : undefined,
    });
  }

  headRefreshIntervalMs(): number {
    return this.options.headRefreshIntervalMs ?? 3_000;
  }

  finalizedRefreshIntervalMs(): number {
    return this.options.finalizedRefreshIntervalMs ?? 30_000;
  }

  validateFilter(filter: Filter): ValidateFilterResult {
    return validateFilter(filter);
  }

  async fetchCursor(args: FetchCursorArgs): Promise<BlockInfo | null> {
    return tracer.startActiveSpan("evm-rpc.fetchCursor", async (span) => {
      try {
        span.setAttributes({
          ...(args.blockNumber !== undefined && {
            blockNumber: args.blockNumber.toString(),
          }),
          ...(args.blockTag !== undefined && { blockTag: args.blockTag }),
          ...(args.blockHash !== undefined && { blockHash: args.blockHash }),
        });

        let block: RpcBlock | null = null;
        if (args.blockNumber !== undefined) {
          const blockNumber = toHex(args.blockNumber);
          block = await this.client.request({
            method: "eth_getBlockByNumber",
            params: [blockNumber, false],
          });
        } else if (args.blockTag) {
          block = await this.client.request({
            method: "eth_getBlockByNumber",
            params: [args.blockTag, false],
          });
        } else if (args.blockHash) {
          block = await this.client.request({
            method: "eth_getBlockByHash",
            params: [args.blockHash, false],
          });
        } else {
          throw new Error(
            "One of blockNumber, blockHash or blockTag must be provided",
          );
        }

        if (!block) {
          return null;
        }

        const formattedBlock = formatBlock(block);

        if (formattedBlock.number === null) {
          throw new Error("RPC block is missing required block number");
        }

        if (formattedBlock.hash === null) {
          throw new Error("RPC block is missing required block hash");
        }

        span.setAttributes({
          "result.blockNumber": formattedBlock.number.toString(),
          "result.blockHash": formattedBlock.hash,
          "result.parentBlockHash": formattedBlock.parentHash,
        });

        return {
          blockNumber: formattedBlock.number,
          blockHash: formattedBlock.hash,
          parentBlockHash: formattedBlock.parentHash,
        };
      } catch (error) {
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  async fetchCursorRange({
    startBlockNumber,
    endBlockNumber,
  }: FetchCursorRangeArgs): Promise<BlockInfo[]> {
    return tracer.startActiveSpan("evm-rpc.fetchCursorRange", async (span) => {
      try {
        span.setAttributes({
          startBlockNumber: startBlockNumber.toString(),
          endBlockNumber: endBlockNumber.toString(),
        });

        const requestCount = Number(endBlockNumber - startBlockNumber + 1n);
        const result = await Promise.all(
          Array.from({ length: requestCount }, async (_, i) => {
            const blockNumber = startBlockNumber + BigInt(i);
            const info = await this.fetchCursorWithRetry({ blockNumber });
            if (!info) {
              throw new Error(
                `RPC returned null block for block number ${blockNumber}`,
              );
            }
            return info;
          }),
        );

        span.setAttribute("result.count", result.length);

        return result;
      } catch (error) {
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  async fetchBlockRange({
    startBlock,
    maxBlock,
    force,
    clampAllowed,
    filter,
  }: FetchBlockRangeArgs<Filter>): Promise<FetchBlockRangeResult<Block>> {
    return tracer.startActiveSpan("evm-rpc.fetchBlockRange", async (span) => {
      try {
        span.setAttributes({
          startBlock: startBlock.toString(),
          maxBlock: maxBlock.toString(),
          force,
          clampAllowed,
        });

        let fromBlock = startBlock;
        let toBlock = maxBlock;

        if (clampAllowed) {
          const { start: newFromBlock, end: newToBlock } =
            this.blockRangeOracle.clampRange({
              start: startBlock,
              end: maxBlock,
            });
          fromBlock = newFromBlock;
          toBlock = newToBlock;
        }

        span.setAttributes({
          fromBlock: fromBlock.toString(),
          toBlock: toBlock.toString(),
        });

        const { logs: logsByBlockNumber, blockNumbers } =
          await this.fetchLogsForRangeWithRetry({
            fromBlock,
            toBlock,
            filter,
          });

        // If the client needs all headers, we iterate over the range and fetch headers
        // and then join them with the logs
        // Otherwise, we drive the block number iteration from the fetched logs.
        const data: FetchBlockResult<Block>[] = [];

        // Fetch block headers in parallel to optimize batching.
        const blockNumberResponses = [];
        if (filter.header === "always") {
          for (
            let blockNumber = fromBlock;
            blockNumber <= toBlock;
            blockNumber++
          ) {
            blockNumberResponses.push(
              this.fetchBlockHeaderByNumberWithRetry({
                blockNumber,
              }),
            );
          }
        } else if (force && blockNumbers.length === 0) {
          blockNumberResponses.push(
            this.fetchBlockHeaderByNumberWithRetry({
              blockNumber: toBlock,
            }),
          );
        } else {
          for (const blockNumber of blockNumbers) {
            blockNumberResponses.push(
              this.fetchBlockHeaderByNumberWithRetry({
                blockNumber,
              }),
            );
          }
        }

        const blockNumbersWithHeader = await Promise.all(blockNumberResponses);
        for (const { blockNumber, header } of blockNumbersWithHeader) {
          const logs = logsByBlockNumber[Number(blockNumber)] ?? [];

          logs.sort((a, b) => a.logIndex - b.logIndex);

          data.push({
            cursor: undefined,
            endCursor: { orderKey: blockNumber, uniqueKey: header.blockHash },
            block: { header, logs },
          });
        }

        span.setAttribute("result.blockCount", data.length);

        return { startBlock: fromBlock, endBlock: toBlock, data };
      } catch (error) {
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  async fetchHeaderByHash({
    blockHash,
  }: FetchBlockByHashArgs<Filter>): Promise<FetchBlockByHashResult<Block>> {
    return tracer.startActiveSpan("evm-rpc.fetchHeaderByHash", async (span) => {
      try {
        span.setAttribute("blockHash", blockHash);

        // Fetch block header and check it matches the expected parent block hash.
        const { header } = await this.fetchBlockHeaderByHashWithRetry({
          blockHash,
        });

        if (header.blockHash === undefined) {
          throw new Error(`Block ${blockHash} has no block hash`);
        }

        const blockInfo: BlockInfo = {
          blockNumber: header.blockNumber,
          blockHash: header.blockHash,
          parentBlockHash: header.parentBlockHash,
        };

        let cursor = undefined;
        if (header.blockNumber > 0n) {
          cursor = {
            orderKey: header.blockNumber - 1n,
            uniqueKey: header.parentBlockHash,
          };
        }

        const endCursor = {
          orderKey: header.blockNumber,
          uniqueKey: header.blockHash,
        };

        const block = {
          header,
          logs: [],
        };

        span.setAttributes({
          "result.blockNumber": header.blockNumber.toString(),
          "result.blockHash": header.blockHash,
        });

        return {
          blockInfo,
          data: {
            cursor,
            endCursor,
            block,
          },
        };
      } catch (error) {
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  private async fetchLogsForRangeWithRetry({
    fromBlock,
    toBlock,
    filter,
  }: {
    fromBlock: bigint;
    toBlock: bigint;
    filter: Filter;
  }): Promise<{ logs: Record<number, Log[]>; blockNumbers: bigint[] }> {
    try {
      return await retry({
        fn: () =>
          fetchLogsForRange({
            client: this.client,
            fromBlock,
            toBlock,
            filter,
            mergeGetLogs: this.options.mergeGetLogsFilter === "always",
          }),
      });
    } catch (error) {
      this.blockRangeOracle.handleError(error);
      throw error;
    }
  }

  private async fetchBlockHeaderByNumberWithRetry({
    blockNumber,
  }: {
    blockNumber: bigint;
  }) {
    return tracer.startActiveSpan(
      "evm-rpc.fetchBlockHeaderByNumber",
      async (span) => {
        try {
          span.setAttribute("blockNumber", blockNumber.toString());

          const block = await retry({
            fn: () =>
              this.client.request({
                method: "eth_getBlockByNumber",
                params: [numberToHex(blockNumber), false],
              }),
          });

          if (block === null) {
            throw new Error(`Block ${blockNumber} not found`);
          }

          const header = rpcBlockHeaderToDna(block);

          if (header.blockHash !== undefined) {
            span.setAttribute("result.blockHash", header.blockHash);
          }

          return { header, blockNumber };
        } catch (error) {
          span.recordException(error as Error);
          throw error;
        } finally {
          span.end();
        }
      },
    );
  }

  private async fetchBlockHeaderByHashWithRetry({
    blockHash,
  }: {
    blockHash: Bytes;
  }) {
    const block = await retry({
      fn: () =>
        this.client.request({
          method: "eth_getBlockByHash",
          params: [blockHash, false],
        }),
    });

    if (block === null) {
      throw new Error(`Block ${blockHash} not found`);
    }

    return { header: rpcBlockHeaderToDna(block) };
  }

  private async fetchCursorWithRetry(args: FetchCursorArgs) {
    return await retry({
      fn: () => this.fetchCursor(args),
    });
  }
}
