import { jsonRpc } from "./http";
import { normalizeFelt } from "./normalize";
import type { BlockCacheOptions, BlockId, BlockMetadata, Felt } from "./types";

export interface StarknetBlockWithTxHashes {
  block_hash?: Felt;
  parent_hash?: Felt;
  block_number?: number;
  timestamp?: number;
  transactions?: Felt[];
  [key: string]: unknown;
}

type CachedBlock = {
  block: StarknetBlockWithTxHashes;
  metadata: BlockMetadata;
};

export class StarknetBlockCache {
  readonly #url: string;
  readonly #signal?: AbortSignal;
  readonly #blocksByNumber = new Map<number, CachedBlock>();
  readonly #blocksByHash = new Map<Felt, CachedBlock>();

  constructor(options: BlockCacheOptions) {
    this.#url = options.url;
    this.#signal = options.signal;
  }

  async getLatestBlock(): Promise<BlockMetadata> {
    const block = await getBlockWithTxHashes({
      url: this.#url,
      blockId: "latest",
      signal: this.#signal,
    });
    return this.#remember(block).metadata;
  }

  async getBlockWithTxHashes(
    blockId: BlockId,
  ): Promise<StarknetBlockWithTxHashes> {
    const cached = this.#getCached(blockId);
    if (cached) {
      return cached.block;
    }

    const block = await getBlockWithTxHashes({
      url: this.#url,
      blockId,
      signal: this.#signal,
    });

    return this.#remember(block).block;
  }

  getCachedMetadata(blockId: BlockId): BlockMetadata | undefined {
    return this.#getCached(blockId)?.metadata;
  }

  invalidateFrom(startingBlockNumber: number): void {
    if (!Number.isInteger(startingBlockNumber) || startingBlockNumber < 0) {
      throw new Error("startingBlockNumber must be a non-negative integer");
    }

    for (const [blockNumber, cached] of this.#blocksByNumber) {
      if (blockNumber >= startingBlockNumber) {
        this.#blocksByNumber.delete(blockNumber);
        this.#blocksByHash.delete(cached.metadata.blockHash);
      }
    }
  }

  #getCached(blockId: BlockId): CachedBlock | undefined {
    if (isBlockNumberId(blockId)) {
      return this.#blocksByNumber.get(blockId.block_number);
    }

    if (isBlockHashId(blockId)) {
      return this.#blocksByHash.get(
        normalizeFelt(blockId.block_hash, "blockId.block_hash"),
      );
    }

    return undefined;
  }

  #remember(block: StarknetBlockWithTxHashes): CachedBlock {
    const metadata = blockMetadataFromRpcBlock(block);
    const cached = { block, metadata };

    this.#blocksByNumber.set(metadata.blockNumber, cached);
    this.#blocksByHash.set(metadata.blockHash, cached);

    return cached;
  }
}

export async function getLatestBlock(
  options: BlockCacheOptions,
): Promise<BlockMetadata> {
  const block = await getBlockWithTxHashes({
    ...options,
    blockId: "latest",
  });

  return blockMetadataFromRpcBlock(block);
}

export async function getBlockWithTxHashes(
  options: BlockCacheOptions & { blockId?: BlockId },
): Promise<StarknetBlockWithTxHashes> {
  return jsonRpc<StarknetBlockWithTxHashes>(
    options.url,
    "starknet_getBlockWithTxHashes",
    [options.blockId ?? "latest"],
    options.signal,
  );
}

function blockMetadataFromRpcBlock(
  block: StarknetBlockWithTxHashes,
): BlockMetadata {
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
    timestamp: block.timestamp,
  };
}

function isBlockNumberId(
  blockId: BlockId | undefined,
): blockId is { block_number: number } {
  return (
    typeof blockId === "object" && blockId !== null && "block_number" in blockId
  );
}

function isBlockHashId(
  blockId: BlockId | undefined,
): blockId is { block_hash: Felt } {
  return (
    typeof blockId === "object" && blockId !== null && "block_hash" in blockId
  );
}
