import type { Bytes } from "@apibara/protocol";
import {
  type BlockInfo,
  type FetchBlockByHashArgs,
  type FetchBlockByHashResult,
  type FetchBlockRangeArgs,
  type FetchBlockRangeResult,
  type FetchCursorArgs,
  type FetchCursorRangeArgs,
  RpcStreamConfig,
  type ValidateFilterResult,
} from "@apibara/protocol/rpc";
import { backfillEvents } from "./backfill";
import {
  type StarknetBlockWithTxHashes,
  getBlockWithTxHashes,
} from "./block-cache";
import { normalizeFelt } from "./normalize";
import type { Felt, NormalizedEvent } from "./types";

export interface StarknetRpcStreamFilter {
  addresses?: Felt[];
  keys?: Felt[][];
  chunkSize?: number;
  header?: "always" | "on_data";
}

export interface StarknetRpcBlockHeader {
  blockNumber: number;
  blockHash: Felt;
  parentBlockHash: Felt;
  timestamp: number;
  raw: StarknetBlockWithTxHashes;
}

export interface StarknetRpcBlock {
  header: StarknetRpcBlockHeader;
  events: NormalizedEvent[];
}

export interface StarknetRpcStreamOptions {
  url: string;
  /** How many blocks to scan in a single starknet_getEvents range when clamping is allowed. */
  getEventsRangeSize?: bigint;
  chunkSize?: number;
  headRefreshIntervalMs?: number;
  finalizedRefreshIntervalMs?: number;
  signal?: AbortSignal;
}

export class StarknetRpcStream extends RpcStreamConfig<
  StarknetRpcStreamFilter,
  StarknetRpcBlock
> {
  private readonly getEventsRangeSize: bigint;

  constructor(private readonly options: StarknetRpcStreamOptions) {
    super();

    this.getEventsRangeSize = normalizeGetEventsRangeSize(
      options.getEventsRangeSize,
    );
  }

  headRefreshIntervalMs(): number {
    return this.options.headRefreshIntervalMs ?? 1_000;
  }

  finalizedRefreshIntervalMs(): number {
    return this.options.finalizedRefreshIntervalMs ?? 30_000;
  }

  validateFilter(filter: StarknetRpcStreamFilter): ValidateFilterResult {
    if (
      filter.header &&
      filter.header !== "always" &&
      filter.header !== "on_data"
    ) {
      return {
        valid: false,
        error: 'header must be "always" or "on_data"',
      };
    }

    if (
      filter.chunkSize !== undefined &&
      !isPositiveInteger(filter.chunkSize)
    ) {
      return {
        valid: false,
        error: "chunkSize must be a positive integer",
      };
    }

    if (filter.addresses?.some((address) => !isHexString(address))) {
      return {
        valid: false,
        error: "addresses must be 0x-prefixed hex strings",
      };
    }

    if (filter.keys?.some((keys) => keys.some((key) => !isHexString(key)))) {
      return {
        valid: false,
        error: "keys must be 0x-prefixed hex strings",
      };
    }

    return { valid: true };
  }

  async fetchCursor(args: FetchCursorArgs): Promise<BlockInfo | null> {
    const block = await getBlockWithTxHashes({
      url: this.options.url,
      blockId: blockIdFromCursorArgs(args),
      signal: this.options.signal,
    });

    return blockInfoFromRpcBlock(block);
  }

  async fetchCursorRange({
    startBlockNumber,
    endBlockNumber,
  }: FetchCursorRangeArgs): Promise<BlockInfo[]> {
    const count = Number(endBlockNumber - startBlockNumber) + 1;
    return Promise.all(
      Array.from({ length: count }, async (_, index) => {
        const blockNumber = startBlockNumber + BigInt(index);
        const info = await this.fetchCursor({ blockNumber });
        if (!info) {
          throw new Error(`Block ${blockNumber} not found`);
        }
        return info;
      }),
    );
  }

  async fetchBlockRange({
    startBlock,
    maxBlock,
    force,
    clampAllowed,
    filter,
  }: FetchBlockRangeArgs<StarknetRpcStreamFilter>): Promise<
    FetchBlockRangeResult<StarknetRpcBlock>
  > {
    const endBlock = clampAllowed
      ? clampBlockRange(startBlock, maxBlock, this.getEventsRangeSize)
      : maxBlock;
    const startBlockNumber = bigintToSafeBlockNumber(startBlock);
    const endBlockNumber = bigintToSafeBlockNumber(endBlock);
    const eventsByBlock = new Map<number, NormalizedEvent[]>();

    for await (const message of backfillEvents({
      url: this.options.url,
      fromBlock: { block_number: startBlockNumber },
      toBlock: { block_number: endBlockNumber },
      addresses: filter.addresses,
      keys: filter.keys,
      chunkSize: filter.chunkSize ?? this.options.chunkSize,
      signal: this.options.signal,
    })) {
      const events = eventsByBlock.get(message.event.blockNumber) ?? [];
      events.push(message.event);
      eventsByBlock.set(message.event.blockNumber, events);
    }

    const blockNumbers = blockNumbersForResult({
      startBlockNumber,
      endBlockNumber,
      force,
      header: filter.header,
      eventBlockNumbers: eventsByBlock.keys(),
    });

    const data = await Promise.all(
      blockNumbers.map(async (blockNumber) => {
        const block = await this.fetchRpcBlock({ block_number: blockNumber });
        const header = blockHeaderFromRpcBlock(block);
        const events = eventsByBlock.get(blockNumber) ?? [];
        events.sort((a, b) => {
          if (a.transactionIndex !== b.transactionIndex) {
            return a.transactionIndex - b.transactionIndex;
          }
          return a.eventIndex - b.eventIndex;
        });

        return {
          cursor: undefined,
          endCursor: cursorFromHeader(header),
          block: { header, events },
        };
      }),
    );

    return {
      startBlock,
      endBlock,
      data,
    };
  }

  async fetchHeaderByHash({
    blockHash,
  }: FetchBlockByHashArgs<StarknetRpcStreamFilter>): Promise<
    FetchBlockByHashResult<StarknetRpcBlock>
  > {
    const block = await this.fetchRpcBlock({ block_hash: blockHash });
    const header = blockHeaderFromRpcBlock(block);
    const blockInfo = blockInfoFromHeader(header);

    return {
      blockInfo,
      data: {
        cursor:
          header.blockNumber > 0
            ? {
                orderKey: BigInt(header.blockNumber - 1),
                uniqueKey: header.parentBlockHash as Bytes,
              }
            : undefined,
        endCursor: cursorFromHeader(header),
        block: {
          header,
          events: [],
        },
      },
    };
  }

  private fetchRpcBlock(
    blockId: { block_number: number } | { block_hash: Felt },
  ) {
    return getBlockWithTxHashes({
      url: this.options.url,
      blockId,
      signal: this.options.signal,
    });
  }
}

function blockIdFromCursorArgs(args: FetchCursorArgs) {
  if (args.blockNumber !== undefined) {
    return { block_number: bigintToSafeBlockNumber(args.blockNumber) };
  }

  if (args.blockHash !== undefined) {
    return { block_hash: args.blockHash };
  }

  return args.blockTag === "finalized" ? "l1_accepted" : "latest";
}

function clampBlockRange(
  startBlock: bigint,
  maxBlock: bigint,
  rangeSize: bigint,
): bigint {
  return minBigInt(maxBlock, startBlock + rangeSize - 1n);
}

function minBigInt(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

function normalizeGetEventsRangeSize(value?: bigint): bigint {
  if (value === undefined) {
    return 1_000n;
  }

  if (value <= 0n) {
    throw new Error("getEventsRangeSize must be positive");
  }

  return value;
}

function blockNumbersForResult({
  startBlockNumber,
  endBlockNumber,
  force,
  header,
  eventBlockNumbers,
}: {
  startBlockNumber: number;
  endBlockNumber: number;
  force: boolean;
  header?: StarknetRpcStreamFilter["header"];
  eventBlockNumbers: Iterable<number>;
}): number[] {
  if (header === "always") {
    return Array.from(
      { length: endBlockNumber - startBlockNumber + 1 },
      (_, index) => startBlockNumber + index,
    );
  }

  const blockNumbers = Array.from(new Set(eventBlockNumbers)).sort(
    (a, b) => a - b,
  );

  if (blockNumbers.length === 0 && force) {
    return [endBlockNumber];
  }

  return blockNumbers;
}

function blockInfoFromRpcBlock(block: StarknetBlockWithTxHashes): BlockInfo {
  return blockInfoFromHeader(blockHeaderFromRpcBlock(block));
}

function blockInfoFromHeader(header: StarknetRpcBlockHeader): BlockInfo {
  return {
    blockNumber: BigInt(header.blockNumber),
    blockHash: header.blockHash as Bytes,
    parentBlockHash: header.parentBlockHash as Bytes,
  };
}

function cursorFromHeader(header: StarknetRpcBlockHeader) {
  return {
    orderKey: BigInt(header.blockNumber),
    uniqueKey: header.blockHash as Bytes,
  };
}

function blockHeaderFromRpcBlock(
  block: StarknetBlockWithTxHashes,
): StarknetRpcBlockHeader {
  if (
    typeof block.block_number !== "number" ||
    !Number.isInteger(block.block_number) ||
    block.block_number < 0
  ) {
    throw new Error(
      "starknet_getBlockWithTxHashes response is missing block_number",
    );
  }

  if (typeof block.block_hash !== "string") {
    throw new Error(
      "starknet_getBlockWithTxHashes response is missing block_hash",
    );
  }

  if (typeof block.parent_hash !== "string") {
    throw new Error(
      "starknet_getBlockWithTxHashes response is missing parent_hash",
    );
  }

  if (
    typeof block.timestamp !== "number" ||
    !Number.isInteger(block.timestamp) ||
    block.timestamp < 0
  ) {
    throw new Error(
      "starknet_getBlockWithTxHashes response is missing timestamp",
    );
  }

  return {
    blockNumber: block.block_number,
    blockHash: normalizeFelt(block.block_hash, "block.block_hash"),
    parentBlockHash: normalizeFelt(block.parent_hash, "block.parent_hash"),
    timestamp: block.timestamp,
    raw: block,
  };
}

function bigintToSafeBlockNumber(value: bigint): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`Block number ${value} is outside the safe integer range`);
  }

  return Number(value);
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function isHexString(value: string): boolean {
  return typeof value === "string" && /^0x[0-9a-fA-F]+$/.test(value);
}
