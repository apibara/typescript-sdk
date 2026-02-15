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
import { fetchLogsByBlockHash, fetchLogsForRange } from "./log-fetcher";
import { type BlockRangeOracle, createBlockRangeOracle } from "./range-oracle";
import { retry } from "./retry";
import { rpcBlockHeaderToDna } from "./transform";

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

    return {
      blockNumber: formattedBlock.number,
      blockHash: formattedBlock.hash,
      parentBlockHash: formattedBlock.parentHash,
    };
  }

  async fetchCursorRange({
    startBlockNumber,
    endBlockNumber,
  }: FetchCursorRangeArgs): Promise<BlockInfo[]> {
    console.log(
      `[EVM] fetchCursorRange: start=${startBlockNumber} end=${endBlockNumber}`,
    );

    const requestCount = Number(endBlockNumber - startBlockNumber + 1n);
    return await Promise.all(
      Array.from({ length: requestCount }, async (_, i) => {
        const blockNumber = startBlockNumber + BigInt(i);
        const info = await this.fetchCursor({ blockNumber });
        if (!info) {
          throw new Error(
            `RPC returned null block for block number ${blockNumber}`,
          );
        }
        return info;
      }),
    );
  }

  async fetchBlockRange({
    startBlock,
    maxBlock,
    force,
    filter,
  }: FetchBlockRangeArgs<Filter>): Promise<FetchBlockRangeResult<Block>> {
    const { start: fromBlock, end: toBlock } = this.blockRangeOracle.clampRange(
      { start: startBlock, end: maxBlock },
    );

    console.log(`[EVM] fetchBlockRange: start=${fromBlock} end=${toBlock}`);

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
      for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
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
        endCursor: { orderKey: blockNumber },
        block: { header, logs },
      });
    }

    return { startBlock: fromBlock, endBlock: toBlock, data };
  }

  async fetchBlockByHash({
    blockHash,
    isAtHead,
    filter,
  }: FetchBlockByHashArgs<Filter>): Promise<FetchBlockByHashResult<Block>> {
    console.log(`[EVM] fetchBlockByHash: hash=${blockHash}`);
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

    return {
      blockInfo,
      data: {
        cursor,
        endCursor,
        block,
      },
    };
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

  private async fetchLogsByBlockHashWithRetry({
    blockHash,
    filter,
  }: {
    blockHash: Bytes;
    filter: Filter;
  }): Promise<{ logs: Log[] }> {
    return await retry({
      fn: () =>
        fetchLogsByBlockHash({
          client: this.client,
          blockHash,
          filter,
          mergeGetLogs:
            this.options.mergeGetLogsFilter === "always" ||
            this.options.mergeGetLogsFilter === "accepted",
        }),
    });
  }

  private async fetchBlockHeaderByNumberWithRetry({
    blockNumber,
  }: {
    blockNumber: bigint;
  }) {
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

    return { header: rpcBlockHeaderToDna(block), blockNumber };
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
}
