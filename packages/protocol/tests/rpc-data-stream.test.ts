import { describe, expect, it } from "vitest";
import type { Cursor } from "../src/common";
import { RpcClient } from "../src/rpc/client";
import type {
  BlockInfo,
  FetchBlockByHashArgs,
  FetchBlockByHashResult,
  FetchBlockRangeArgs,
  FetchBlockRangeResult,
  FetchCursorArgs,
  FetchCursorRangeArgs,
} from "../src/rpc/config";
import { RpcStreamConfig } from "../src/rpc/config";
import type { StreamDataResponse } from "../src/stream";

type TestFilter = Record<string, never>;
type TestBlock = {
  blockNumber: bigint;
  blockHash: string;
};

class EmptyRangeMockConfig extends RpcStreamConfig<TestFilter, TestBlock> {
  public fetchBlockByHashCalls = 0;
  public fetchBlockRangeCalls: Array<{ startBlock: bigint; maxBlock: bigint }> =
    [];

  private readonly blocks = new Map<bigint, BlockInfo>();
  private readonly finalized = 5n;
  private readonly head = 15n;
  private rangeCalls = 0;

  constructor() {
    super();

    for (let i = 0n; i <= this.head; i++) {
      this.blocks.set(i, {
        blockNumber: i,
        blockHash: `0x${i.toString(16)}`,
        parentBlockHash: i === 0n ? "0x0" : `0x${(i - 1n).toString(16)}`,
      });
    }
  }

  headRefreshIntervalMs(): number {
    return 1_000;
  }

  finalizedRefreshIntervalMs(): number {
    return 60_000;
  }

  async fetchCursor(args: FetchCursorArgs): Promise<BlockInfo | null> {
    if (args.blockTag === "latest") {
      return this.blocks.get(this.head) ?? null;
    }
    if (args.blockTag === "finalized") {
      return this.blocks.get(this.finalized) ?? null;
    }
    if (args.blockNumber !== undefined) {
      return this.blocks.get(args.blockNumber) ?? null;
    }
    if (args.blockHash !== undefined) {
      const match = Array.from(this.blocks.values()).find(
        (b) => b.blockHash === args.blockHash,
      );
      return match ?? null;
    }
    return null;
  }

  async fetchCursorRange({
    startBlockNumber,
    endBlockNumber,
  }: FetchCursorRangeArgs): Promise<BlockInfo[]> {
    const result: BlockInfo[] = [];
    for (let i = startBlockNumber; i <= endBlockNumber; i++) {
      const block = this.blocks.get(i);
      if (!block) {
        throw new Error(`Missing block ${i}`);
      }
      result.push(block);
    }
    return result;
  }

  validateFilter() {
    return { valid: true as const };
  }

  async fetchBlockRange({
    startBlock,
    maxBlock,
  }: FetchBlockRangeArgs<TestFilter>): Promise<FetchBlockRangeResult<TestBlock>> {
    this.fetchBlockRangeCalls.push({ startBlock, maxBlock });
    this.rangeCalls += 1;

    if (this.rangeCalls === 1) {
      // First live batch has no matches and does not reach head.
      return {
        startBlock,
        endBlock: 10n,
        data: [],
      };
    }

    // Second live batch returns one matching block.
    return {
      startBlock,
      endBlock: 12n,
      data: [
        {
          cursor: {
            orderKey: 11n,
            uniqueKey: "0xb",
          },
          endCursor: {
            orderKey: 12n,
            uniqueKey: "0xc",
          },
          block: {
            blockNumber: 12n,
            blockHash: "0xc",
          },
        },
      ],
    };
  }

  async fetchBlockByHash({
    blockHash,
  }: FetchBlockByHashArgs<TestFilter>): Promise<FetchBlockByHashResult<TestBlock>> {
    this.fetchBlockByHashCalls += 1;
    const blockInfo = await this.fetchCursor({ blockHash });
    if (!blockInfo) {
      throw new Error(`Missing block for hash ${blockHash}`);
    }

    return {
      blockInfo,
      data: {
        cursor: {
          orderKey: blockInfo.blockNumber - 1n,
          uniqueKey: blockInfo.parentBlockHash,
        },
        endCursor: {
          orderKey: blockInfo.blockNumber,
          uniqueKey: blockInfo.blockHash,
        },
        block: {
          blockNumber: blockInfo.blockNumber,
          blockHash: blockInfo.blockHash,
        },
      },
    };
  }
}

describe("RpcDataStream", () => {
  it("does not emit head for an empty non-head range", async () => {
    const config = new EmptyRangeMockConfig();
    const client = new RpcClient<TestFilter, TestBlock>(config);

    const request = {
      filter: [{}],
      startingCursor: {
        orderKey: 5n,
        uniqueKey: "0x5",
      } satisfies Cursor,
    };

    let firstData: StreamDataResponse<TestBlock> | undefined;
    for await (const message of client.streamData(request, {
      endingCursor: { orderKey: 12n },
    })) {
      if (message._tag === "data") {
        firstData = message;
        break;
      }
    }

    expect(firstData?._tag).toBe("data");
    if (firstData?._tag === "data") {
      expect(firstData.data.endCursor.orderKey).toBe(12n);
    }

    expect(config.fetchBlockByHashCalls).toBe(0);
    expect(config.fetchBlockRangeCalls).toEqual([
      { startBlock: 6n, maxBlock: 15n },
      { startBlock: 11n, maxBlock: 15n },
    ]);
  });
});
