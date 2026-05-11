import { describe, expect, it } from "vitest";
import type { Bytes, Cursor } from "../src/common";
import { RpcClient } from "../src/rpc/client";
import {
  type BlockInfo,
  type FetchBlockByHashArgs,
  type FetchBlockByHashResult,
  type FetchBlockRangeArgs,
  type FetchBlockRangeResult,
  type FetchCursorArgs,
  type FetchCursorRangeArgs,
  RpcStreamConfig,
} from "../src/rpc/config";

type TestBlock = {
  blockNumber: bigint;
};

class EmptyLiveHeadConfig extends RpcStreamConfig<string, TestBlock> {
  fetchBlockRangeCalls: FetchBlockRangeArgs<string>[] = [];
  headBlock = 2n;

  headRefreshIntervalMs(): number {
    return 10;
  }

  finalizedRefreshIntervalMs(): number {
    return 10_000;
  }

  validateFilter() {
    return { valid: true as const };
  }

  async fetchCursor(args: FetchCursorArgs): Promise<BlockInfo | null> {
    if (args.blockTag === "latest") {
      return blockInfo(this.headBlock);
    }

    if (args.blockTag === "finalized") {
      return blockInfo(1n);
    }

    if (args.blockNumber !== undefined) {
      return blockInfo(args.blockNumber);
    }

    return blockInfo(blockNumberFromHash(args.blockHash));
  }

  async fetchCursorRange({
    startBlockNumber,
    endBlockNumber,
  }: FetchCursorRangeArgs): Promise<BlockInfo[]> {
    const blocks: BlockInfo[] = [];
    for (
      let blockNumber = startBlockNumber;
      blockNumber <= endBlockNumber;
      blockNumber++
    ) {
      blocks.push(blockInfo(blockNumber));
    }
    return blocks;
  }

  async fetchBlockRange(
    args: FetchBlockRangeArgs<string>,
  ): Promise<FetchBlockRangeResult<TestBlock>> {
    this.fetchBlockRangeCalls.push(args);
    await sleep(1);

    return {
      startBlock: args.startBlock,
      endBlock: args.maxBlock,
      data: [],
    };
  }

  async fetchHeaderByHash({
    blockHash,
  }: FetchBlockByHashArgs<string>): Promise<
    FetchBlockByHashResult<TestBlock>
  > {
    const blockNumber = blockNumberFromHash(blockHash);
    const info = blockInfo(blockNumber);

    return {
      blockInfo: info,
      data: {
        cursor: cursorForBlock(blockNumber - 1n),
        endCursor: cursorForBlock(blockNumber)!,
        block: { blockNumber },
      },
    };
  }
}

describe("RpcDataStream", () => {
  it("does not refetch empty accepted blocks as the live head advances", async () => {
    const config = new EmptyLiveHeadConfig();
    const client = new RpcClient(config);
    const stream = client.streamData({
      finality: "accepted",
      filter: ["logs"],
      startingCursor: { orderKey: 1n },
    });
    const iterator = stream[Symbol.asyncIterator]();

    try {
      const first = await iterator.next();

      expect(first.done).toBe(false);
      expect(first.value).toMatchObject({
        _tag: "data",
        data: {
          endCursor: { orderKey: 2n },
          finality: "accepted",
          production: "live",
        },
      });
      expect(config.fetchBlockRangeCalls).toHaveLength(1);
      expect(config.fetchBlockRangeCalls[0]).toMatchObject({
        startBlock: 2n,
        maxBlock: 2n,
      });

      config.headBlock = 3n;
      const second = await withTimeout(iterator.next(), 1_000);

      expect(second.done).toBe(false);
      expect(second.value).toMatchObject({
        _tag: "data",
        data: {
          endCursor: { orderKey: 3n },
          finality: "accepted",
          production: "live",
        },
      });
      expect(config.fetchBlockRangeCalls).toHaveLength(2);
      expect(config.fetchBlockRangeCalls[1]).toMatchObject({
        startBlock: 3n,
        maxBlock: 3n,
      });
      await iterator.return?.();
    } finally {
      await iterator.return?.();
    }
  });
});

function blockInfo(blockNumber: bigint): BlockInfo {
  return {
    blockNumber,
    blockHash: blockHash(blockNumber),
    parentBlockHash: blockHash(blockNumber - 1n),
  };
}

function cursorForBlock(blockNumber: bigint): Cursor | undefined {
  if (blockNumber < 0n) {
    return undefined;
  }

  return {
    orderKey: blockNumber,
    uniqueKey: blockHash(blockNumber),
  };
}

function blockHash(blockNumber: bigint): Bytes {
  const value = blockNumber < 0n ? 0n : blockNumber;
  return `0x${value.toString(16).padStart(64, "0")}`;
}

function blockNumberFromHash(hash: Bytes): bigint {
  return BigInt(hash);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    sleep(ms).then(() => {
      throw new Error(`Timed out after ${ms}ms`);
    }),
  ]);
}
