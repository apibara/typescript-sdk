import { beforeEach, describe, expect, it } from "vitest";
import type { Bytes, Cursor } from "../src/common";
import { RpcClient } from "../src/rpc/client";
import { RpcStreamConfig } from "../src/rpc/config";
import type { BlockInfo, FinalizedRangeResult } from "../src/rpc/types";
import type { StreamDataRequest, StreamDataResponse } from "../src/stream";

type TestFilter = {
  eventName?: string;
};

type TestBlock = {
  blockNumber: bigint;
  blockHash: string;
  data: string;
};

class MockRpcConfig extends RpcStreamConfig<TestFilter, TestBlock> {
  private blockStore = new Map<bigint, BlockInfo>();
  private blockDataStore = new Map<bigint, TestBlock>();
  public finalizedBlock = 0n;
  public headBlock = 0n;

  constructor() {
    super();
    this.initializeBlocks();
  }

  private initializeBlocks() {
    for (let i = 0n; i <= 100n; i++) {
      const blockInfo: BlockInfo = {
        blockNumber: i,
        blockHash: `0xblock${i}`,
        parentHash: i > 0n ? `0xblock${i - 1n}` : "0x0",
      };
      this.blockStore.set(i, blockInfo);
      this.blockDataStore.set(i, {
        blockNumber: i,
        blockHash: `0xblock${i}`,
        data: `block ${i} data`,
      });
    }
  }

  validateFilter(_filter: TestFilter): void {}

  async getCursor(type: "head" | "finalized"): Promise<Cursor> {
    const blockNum =
      type === "finalized" ? this.finalizedBlock : this.headBlock;
    return {
      orderKey: blockNum,
      uniqueKey: `0xblock${blockNum}`,
    };
  }

  async getBlockInfo(blockNumber: bigint): Promise<BlockInfo> {
    const block = this.blockStore.get(blockNumber);
    if (!block) {
      throw new Error(`Block ${blockNumber} not found`);
    }
    return block;
  }

  async fetchFinalizedRange(
    startBlock: bigint,
    endBlock: bigint,
    _filter: TestFilter[],
  ): Promise<FinalizedRangeResult<TestBlock>> {
    const blocks: (TestBlock | null)[] = [];
    let actualEnd = endBlock;

    for (let i = startBlock; i <= endBlock && i <= this.finalizedBlock; i++) {
      const block = this.blockDataStore.get(i);
      blocks.push(block || null);
      actualEnd = i;
    }

    return {
      blocks,
      startCursor: {
        orderKey: startBlock - 1n,
        uniqueKey: startBlock > 0n ? `0xblock${startBlock - 1n}` : undefined,
      },
      endCursor: {
        orderKey: actualEnd,
        uniqueKey: `0xblock${actualEnd}`,
      },
    };
  }

  async fetchBlock(
    blockNumber: bigint,
    _filter: TestFilter[],
  ): Promise<TestBlock | null> {
    return this.blockDataStore.get(blockNumber) || null;
  }

  async verifyBlock(blockNumber: bigint, blockHash: string): Promise<boolean> {
    const block = this.blockStore.get(blockNumber);
    return block?.blockHash === blockHash;
  }

  addBlock(blockNumber: bigint, parentHash?: Bytes) {
    const blockInfo: BlockInfo = {
      blockNumber,
      blockHash: `0xblock${blockNumber}`,
      parentHash: parentHash || `0xblock${blockNumber - 1n}`,
    };
    this.blockStore.set(blockNumber, blockInfo);
    this.blockDataStore.set(blockNumber, {
      blockNumber,
      blockHash: `0xblock${blockNumber}`,
      data: `block ${blockNumber} data`,
    });
  }

  simulateReorg(fromBlock: bigint) {
    for (let i = fromBlock; i <= this.headBlock; i++) {
      const newHash = `0xblock${i}_reorg` as Bytes;
      const blockInfo: BlockInfo = {
        blockNumber: i,
        blockHash: newHash,
        parentHash:
          i > fromBlock ? `0xblock${i - 1n}_reorg` : `0xblock${i - 1n}`,
      };
      this.blockStore.set(i, blockInfo);
      this.blockDataStore.set(i, {
        blockNumber: i,
        blockHash: newHash,
        data: `block ${i} reorg data`,
      });
    }
  }

  advanceChain(newHead: bigint, newFinalized?: bigint) {
    const oldHead = this.headBlock;
    this.headBlock = newHead;
    if (newFinalized !== undefined) {
      this.finalizedBlock = newFinalized;
    }

    for (let i = oldHead + 1n; i <= newHead; i++) {
      this.addBlock(i);
    }
  }
}

describe("RpcClient", () => {
  let config: MockRpcConfig;
  let client: RpcClient<TestFilter, TestBlock>;

  beforeEach(() => {
    config = new MockRpcConfig();
  });

  describe("backfill phase", () => {
    it("backfills from block 0 to finalized", async () => {
      config.finalizedBlock = 25n;
      config.headBlock = 30n;

      client = new RpcClient(config);

      const request: StreamDataRequest<TestFilter> = {
        finality: "finalized",
        filter: [],
      };

      const messages: StreamDataResponse<TestBlock>[] = [];
      const stream = client.streamData(request);

      for await (const msg of stream) {
        messages.push(msg);
        if (msg._tag === "data" && msg.data.endCursor.orderKey >= 25n) {
          break;
        }
      }

      expect(messages.length).toBeGreaterThan(0);
      const dataMessages = messages.filter((m) => m._tag === "data");
      expect(dataMessages.length).toBeGreaterThan(0);

      const lastMessage = dataMessages[dataMessages.length - 1];
      if (lastMessage && lastMessage._tag === "data") {
        expect(lastMessage.data.endCursor.orderKey).toBe(25n);
        expect(lastMessage.data.finality).toBe("finalized");
        expect(lastMessage.data.production).toBe("backfill");
      }

      expect(messages).toMatchInlineSnapshot(`
        [
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": -1n,
                "uniqueKey": undefined,
              },
              "data": [
                {
                  "blockHash": "0xblock0",
                  "blockNumber": 0n,
                  "data": "block 0 data",
                },
                {
                  "blockHash": "0xblock1",
                  "blockNumber": 1n,
                  "data": "block 1 data",
                },
                {
                  "blockHash": "0xblock2",
                  "blockNumber": 2n,
                  "data": "block 2 data",
                },
                {
                  "blockHash": "0xblock3",
                  "blockNumber": 3n,
                  "data": "block 3 data",
                },
                {
                  "blockHash": "0xblock4",
                  "blockNumber": 4n,
                  "data": "block 4 data",
                },
                {
                  "blockHash": "0xblock5",
                  "blockNumber": 5n,
                  "data": "block 5 data",
                },
                {
                  "blockHash": "0xblock6",
                  "blockNumber": 6n,
                  "data": "block 6 data",
                },
                {
                  "blockHash": "0xblock7",
                  "blockNumber": 7n,
                  "data": "block 7 data",
                },
                {
                  "blockHash": "0xblock8",
                  "blockNumber": 8n,
                  "data": "block 8 data",
                },
                {
                  "blockHash": "0xblock9",
                  "blockNumber": 9n,
                  "data": "block 9 data",
                },
              ],
              "endCursor": {
                "orderKey": 9n,
                "uniqueKey": "0xblock9",
              },
              "finality": "finalized",
              "production": "backfill",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 9n,
                "uniqueKey": "0xblock9",
              },
              "data": [
                {
                  "blockHash": "0xblock10",
                  "blockNumber": 10n,
                  "data": "block 10 data",
                },
                {
                  "blockHash": "0xblock11",
                  "blockNumber": 11n,
                  "data": "block 11 data",
                },
                {
                  "blockHash": "0xblock12",
                  "blockNumber": 12n,
                  "data": "block 12 data",
                },
                {
                  "blockHash": "0xblock13",
                  "blockNumber": 13n,
                  "data": "block 13 data",
                },
                {
                  "blockHash": "0xblock14",
                  "blockNumber": 14n,
                  "data": "block 14 data",
                },
                {
                  "blockHash": "0xblock15",
                  "blockNumber": 15n,
                  "data": "block 15 data",
                },
                {
                  "blockHash": "0xblock16",
                  "blockNumber": 16n,
                  "data": "block 16 data",
                },
                {
                  "blockHash": "0xblock17",
                  "blockNumber": 17n,
                  "data": "block 17 data",
                },
                {
                  "blockHash": "0xblock18",
                  "blockNumber": 18n,
                  "data": "block 18 data",
                },
                {
                  "blockHash": "0xblock19",
                  "blockNumber": 19n,
                  "data": "block 19 data",
                },
              ],
              "endCursor": {
                "orderKey": 19n,
                "uniqueKey": "0xblock19",
              },
              "finality": "finalized",
              "production": "backfill",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 19n,
                "uniqueKey": "0xblock19",
              },
              "data": [
                {
                  "blockHash": "0xblock20",
                  "blockNumber": 20n,
                  "data": "block 20 data",
                },
                {
                  "blockHash": "0xblock21",
                  "blockNumber": 21n,
                  "data": "block 21 data",
                },
                {
                  "blockHash": "0xblock22",
                  "blockNumber": 22n,
                  "data": "block 22 data",
                },
                {
                  "blockHash": "0xblock23",
                  "blockNumber": 23n,
                  "data": "block 23 data",
                },
                {
                  "blockHash": "0xblock24",
                  "blockNumber": 24n,
                  "data": "block 24 data",
                },
                {
                  "blockHash": "0xblock25",
                  "blockNumber": 25n,
                  "data": "block 25 data",
                },
              ],
              "endCursor": {
                "orderKey": 25n,
                "uniqueKey": "0xblock25",
              },
              "finality": "finalized",
              "production": "backfill",
            },
          },
        ]
      `);
    });

    it("starts from provided startingCursor", async () => {
      config.finalizedBlock = 50n;
      config.headBlock = 60n;

      client = new RpcClient(config);

      const request: StreamDataRequest<TestFilter> = {
        finality: "finalized",
        filter: [],
        startingCursor: {
          orderKey: 40n,
          uniqueKey: "0xblock40",
        },
      };

      const messages: StreamDataResponse<TestBlock>[] = [];
      const stream = client.streamData(request);

      for await (const msg of stream) {
        messages.push(msg);
        if (msg._tag === "data" && msg.data.endCursor.orderKey >= 50n) {
          break;
        }
      }

      const dataMessages = messages.filter((m) => m._tag === "data");
      const firstMessage = dataMessages[0];

      expect(firstMessage).toBeDefined();
      if (firstMessage && firstMessage._tag === "data") {
        expect(firstMessage.data.cursor?.orderKey).toBeGreaterThanOrEqual(40n);
        expect(firstMessage.data.endCursor?.orderKey).toBeGreaterThan(40n);
      }
    });

    it("throws error if startingCursor hash is invalid", async () => {
      config.finalizedBlock = 50n;
      config.headBlock = 60n;

      client = new RpcClient(config);

      const request: StreamDataRequest<TestFilter> = {
        finality: "finalized",
        filter: [],
        startingCursor: {
          orderKey: 40n,
          uniqueKey: "0xINVALID",
        },
      };

      await expect(async () => {
        const stream = client.streamData(request);
        for await (const msg of stream) {
          break;
        }
      }).rejects.toThrow("does not match hash");
    });
  });

  describe("live streaming", () => {
    it("streams accepted blocks", async () => {
      config.finalizedBlock = 5n;
      config.headBlock = 20n;

      client = new RpcClient(config);

      const request: StreamDataRequest<TestFilter> = {
        finality: "accepted",
        filter: [],
        startingCursor: { orderKey: 4n },
      };

      const messages: StreamDataResponse<TestBlock>[] = [];
      const stream = client.streamData(request);

      for await (const msg of stream) {
        messages.push(msg);
        if (
          msg._tag === "data" &&
          msg.data.endCursor.orderKey >= 20n &&
          msg.data.production === "live"
        ) {
          break;
        }
      }

      const dataMessages = messages.filter((m) => m._tag === "data");
      const liveMessages = dataMessages.filter(
        (m) => m.data.production === "live",
      );

      expect(liveMessages.length).toBeGreaterThan(0);

      const hasAcceptedBlocks = liveMessages.some(
        (m) => m.data.finality === "accepted",
      );
      expect(hasAcceptedBlocks).toBe(true);
      expect(messages).toMatchInlineSnapshot(`
        [
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 4n,
                "uniqueKey": "0xblock4",
              },
              "data": [
                {
                  "blockHash": "0xblock5",
                  "blockNumber": 5n,
                  "data": "block 5 data",
                },
              ],
              "endCursor": {
                "orderKey": 5n,
                "uniqueKey": "0xblock5",
              },
              "finality": "finalized",
              "production": "backfill",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 5n,
                "uniqueKey": "0xblock5",
              },
              "data": [
                {
                  "blockHash": "0xblock6",
                  "blockNumber": 6n,
                  "data": "block 6 data",
                },
              ],
              "endCursor": {
                "orderKey": 6n,
                "uniqueKey": "0xblock6",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 6n,
                "uniqueKey": "0xblock6",
              },
              "data": [
                {
                  "blockHash": "0xblock7",
                  "blockNumber": 7n,
                  "data": "block 7 data",
                },
              ],
              "endCursor": {
                "orderKey": 7n,
                "uniqueKey": "0xblock7",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 7n,
                "uniqueKey": "0xblock7",
              },
              "data": [
                {
                  "blockHash": "0xblock8",
                  "blockNumber": 8n,
                  "data": "block 8 data",
                },
              ],
              "endCursor": {
                "orderKey": 8n,
                "uniqueKey": "0xblock8",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 8n,
                "uniqueKey": "0xblock8",
              },
              "data": [
                {
                  "blockHash": "0xblock9",
                  "blockNumber": 9n,
                  "data": "block 9 data",
                },
              ],
              "endCursor": {
                "orderKey": 9n,
                "uniqueKey": "0xblock9",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 9n,
                "uniqueKey": "0xblock9",
              },
              "data": [
                {
                  "blockHash": "0xblock10",
                  "blockNumber": 10n,
                  "data": "block 10 data",
                },
              ],
              "endCursor": {
                "orderKey": 10n,
                "uniqueKey": "0xblock10",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 10n,
                "uniqueKey": "0xblock10",
              },
              "data": [
                {
                  "blockHash": "0xblock11",
                  "blockNumber": 11n,
                  "data": "block 11 data",
                },
              ],
              "endCursor": {
                "orderKey": 11n,
                "uniqueKey": "0xblock11",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 11n,
                "uniqueKey": "0xblock11",
              },
              "data": [
                {
                  "blockHash": "0xblock12",
                  "blockNumber": 12n,
                  "data": "block 12 data",
                },
              ],
              "endCursor": {
                "orderKey": 12n,
                "uniqueKey": "0xblock12",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 12n,
                "uniqueKey": "0xblock12",
              },
              "data": [
                {
                  "blockHash": "0xblock13",
                  "blockNumber": 13n,
                  "data": "block 13 data",
                },
              ],
              "endCursor": {
                "orderKey": 13n,
                "uniqueKey": "0xblock13",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 13n,
                "uniqueKey": "0xblock13",
              },
              "data": [
                {
                  "blockHash": "0xblock14",
                  "blockNumber": 14n,
                  "data": "block 14 data",
                },
              ],
              "endCursor": {
                "orderKey": 14n,
                "uniqueKey": "0xblock14",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 14n,
                "uniqueKey": "0xblock14",
              },
              "data": [
                {
                  "blockHash": "0xblock15",
                  "blockNumber": 15n,
                  "data": "block 15 data",
                },
              ],
              "endCursor": {
                "orderKey": 15n,
                "uniqueKey": "0xblock15",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 15n,
                "uniqueKey": "0xblock15",
              },
              "data": [
                {
                  "blockHash": "0xblock16",
                  "blockNumber": 16n,
                  "data": "block 16 data",
                },
              ],
              "endCursor": {
                "orderKey": 16n,
                "uniqueKey": "0xblock16",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 16n,
                "uniqueKey": "0xblock16",
              },
              "data": [
                {
                  "blockHash": "0xblock17",
                  "blockNumber": 17n,
                  "data": "block 17 data",
                },
              ],
              "endCursor": {
                "orderKey": 17n,
                "uniqueKey": "0xblock17",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 17n,
                "uniqueKey": "0xblock17",
              },
              "data": [
                {
                  "blockHash": "0xblock18",
                  "blockNumber": 18n,
                  "data": "block 18 data",
                },
              ],
              "endCursor": {
                "orderKey": 18n,
                "uniqueKey": "0xblock18",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 18n,
                "uniqueKey": "0xblock18",
              },
              "data": [
                {
                  "blockHash": "0xblock19",
                  "blockNumber": 19n,
                  "data": "block 19 data",
                },
              ],
              "endCursor": {
                "orderKey": 19n,
                "uniqueKey": "0xblock19",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 19n,
                "uniqueKey": "0xblock19",
              },
              "data": [
                {
                  "blockHash": "0xblock20",
                  "blockNumber": 20n,
                  "data": "block 20 data",
                },
              ],
              "endCursor": {
                "orderKey": 20n,
                "uniqueKey": "0xblock20",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
        ]
      `);
    });
  });

  describe("reorg detection", () => {
    it("detects reorg and sends invalidate message", async () => {
      config.finalizedBlock = 5n;
      config.headBlock = 15n;

      client = new RpcClient(config);

      const request: StreamDataRequest<TestFilter> = {
        finality: "accepted",
        filter: [],
        startingCursor: { orderKey: 4n },
      };

      const messages: StreamDataResponse<TestBlock>[] = [];
      const stream = client.streamData(request);

      let blockCount = 0;
      for await (const msg of stream) {
        messages.push(msg);

        if (msg._tag === "data") {
          blockCount++;

          if (blockCount === 5) {
            config.simulateReorg(8n);
          }

          if (blockCount > 10) {
            break;
          }
        }
      }

      const invalidateMsg = messages.find((m) => m._tag === "invalidate");
      expect(invalidateMsg).toBeDefined();
      if (invalidateMsg && invalidateMsg._tag === "invalidate") {
        expect(invalidateMsg.invalidate.cursor?.orderKey).toBe(7n);
      }

      const dataAfterReorg = messages
        .slice(messages.indexOf(invalidateMsg!) + 1)
        .filter((m) => m._tag === "data");

      expect(dataAfterReorg.length).toBeGreaterThan(0);
      expect(messages).toMatchInlineSnapshot(`
        [
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 4n,
                "uniqueKey": "0xblock4",
              },
              "data": [
                {
                  "blockHash": "0xblock5",
                  "blockNumber": 5n,
                  "data": "block 5 data",
                },
              ],
              "endCursor": {
                "orderKey": 5n,
                "uniqueKey": "0xblock5",
              },
              "finality": "finalized",
              "production": "backfill",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 5n,
                "uniqueKey": "0xblock5",
              },
              "data": [
                {
                  "blockHash": "0xblock6",
                  "blockNumber": 6n,
                  "data": "block 6 data",
                },
              ],
              "endCursor": {
                "orderKey": 6n,
                "uniqueKey": "0xblock6",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 6n,
                "uniqueKey": "0xblock6",
              },
              "data": [
                {
                  "blockHash": "0xblock7",
                  "blockNumber": 7n,
                  "data": "block 7 data",
                },
              ],
              "endCursor": {
                "orderKey": 7n,
                "uniqueKey": "0xblock7",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 7n,
                "uniqueKey": "0xblock7",
              },
              "data": [
                {
                  "blockHash": "0xblock8",
                  "blockNumber": 8n,
                  "data": "block 8 data",
                },
              ],
              "endCursor": {
                "orderKey": 8n,
                "uniqueKey": "0xblock8",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 8n,
                "uniqueKey": "0xblock8",
              },
              "data": [
                {
                  "blockHash": "0xblock9",
                  "blockNumber": 9n,
                  "data": "block 9 data",
                },
              ],
              "endCursor": {
                "orderKey": 9n,
                "uniqueKey": "0xblock9",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "invalidate",
            "invalidate": {
              "cursor": {
                "orderKey": 7n,
                "uniqueKey": "0xblock7",
              },
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 7n,
                "uniqueKey": "0xblock7",
              },
              "data": [
                {
                  "blockHash": "0xblock8_reorg",
                  "blockNumber": 8n,
                  "data": "block 8 reorg data",
                },
              ],
              "endCursor": {
                "orderKey": 8n,
                "uniqueKey": "0xblock8_reorg",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 8n,
                "uniqueKey": "0xblock8_reorg",
              },
              "data": [
                {
                  "blockHash": "0xblock9_reorg",
                  "blockNumber": 9n,
                  "data": "block 9 reorg data",
                },
              ],
              "endCursor": {
                "orderKey": 9n,
                "uniqueKey": "0xblock9_reorg",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 9n,
                "uniqueKey": "0xblock9_reorg",
              },
              "data": [
                {
                  "blockHash": "0xblock10_reorg",
                  "blockNumber": 10n,
                  "data": "block 10 reorg data",
                },
              ],
              "endCursor": {
                "orderKey": 10n,
                "uniqueKey": "0xblock10_reorg",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 10n,
                "uniqueKey": "0xblock10_reorg",
              },
              "data": [
                {
                  "blockHash": "0xblock11_reorg",
                  "blockNumber": 11n,
                  "data": "block 11 reorg data",
                },
              ],
              "endCursor": {
                "orderKey": 11n,
                "uniqueKey": "0xblock11_reorg",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 11n,
                "uniqueKey": "0xblock11_reorg",
              },
              "data": [
                {
                  "blockHash": "0xblock12_reorg",
                  "blockNumber": 12n,
                  "data": "block 12 reorg data",
                },
              ],
              "endCursor": {
                "orderKey": 12n,
                "uniqueKey": "0xblock12_reorg",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
          {
            "_tag": "data",
            "data": {
              "cursor": {
                "orderKey": 12n,
                "uniqueKey": "0xblock12_reorg",
              },
              "data": [
                {
                  "blockHash": "0xblock13_reorg",
                  "blockNumber": 13n,
                  "data": "block 13 reorg data",
                },
              ],
              "endCursor": {
                "orderKey": 13n,
                "uniqueKey": "0xblock13_reorg",
              },
              "finality": "accepted",
              "production": "live",
            },
          },
        ]
      `);
    });
  });

  describe("status", () => {
    it("returns current head and finalized status", async () => {
      config.finalizedBlock = 100n;
      config.headBlock = 150n;

      client = new RpcClient(config);

      const status = await client.status();

      expect(status.currentHead?.orderKey).toBe(150n);
      expect(status.lastIngested?.orderKey).toBe(150n);
      expect(status.finalized?.orderKey).toBe(100n);
      expect(status.starting?.orderKey).toBe(0n);
    });
  });

  describe("stopping stream", () => {
    it("stops at endingCursor", async () => {
      config.finalizedBlock = 50n;
      config.headBlock = 60n;

      client = new RpcClient(config);

      const request: StreamDataRequest<TestFilter> = {
        finality: "finalized",
        filter: [],
      };

      const options = {
        endingCursor: { orderKey: 20n },
      };

      const messages: StreamDataResponse<TestBlock>[] = [];
      const stream = client.streamData(request, options);

      for await (const msg of stream) {
        messages.push(msg);
      }

      const dataMessages = messages.filter((m) => m._tag === "data");
      expect(dataMessages.length).toBeGreaterThan(0);

      const lastMessage = dataMessages[dataMessages.length - 1];

      if (lastMessage && lastMessage._tag === "data") {
        expect(lastMessage.data.endCursor?.orderKey).toBeGreaterThanOrEqual(
          20n,
        );
        expect(lastMessage.data.endCursor?.orderKey).toBeLessThanOrEqual(30n);
      }
    });
  });

  describe("heartbeat", () => {
    it(
      "sends heartbeat when no new blocks for heartbeat interval",
      { timeout: 1000 },
      async () => {
        config.finalizedBlock = 5n;
        config.headBlock = 5n;

        client = new RpcClient(config);

        const request: StreamDataRequest<TestFilter> = {
          finality: "finalized",
          filter: [],
          startingCursor: { orderKey: 4n },
          // 100ms
          heartbeatInterval: { seconds: 0n, nanos: 100_000_000 },
        };

        const messages: StreamDataResponse<TestBlock>[] = [];
        const stream = client.streamData(request);

        // 350ms timeout
        const timeout = new Promise<void>((resolve) =>
          setTimeout(resolve, 350),
        );
        const collectMessages = (async () => {
          for await (const msg of stream) {
            messages.push(msg);
          }
        })();

        await Promise.race([collectMessages, timeout]);

        const heartbeats = messages.filter((m) => m._tag === "heartbeat");
        // Should have at least 2 heartbeats in 350ms (100ms interval)
        expect(heartbeats.length).toBeGreaterThanOrEqual(2);
      },
    );
  });

  describe("finalize message", () => {
    it(
      "sends finalize message when finalized cursor advances",
      { timeout: 8000 },
      async () => {
        config.finalizedBlock = 5n;
        config.headBlock = 20n;

        client = new RpcClient(config);

        const request: StreamDataRequest<TestFilter> = {
          finality: "accepted",
          filter: [],
          startingCursor: { orderKey: 4n },
        };

        const messages: StreamDataResponse<TestBlock>[] = [];
        const stream = client.streamData(request);

        let dataCount = 0;
        let hasAdvancedFinalized = false;

        // Need to wait for refresh cycle (5s by default)
        const timeout = new Promise<void>((resolve) =>
          setTimeout(resolve, 6000),
        );
        const collectMessages = (async () => {
          for await (const msg of stream) {
            messages.push(msg);

            if (msg._tag === "data") {
              dataCount++;

              // After receiving a few blocks, advance finalized
              if (dataCount === 5 && !hasAdvancedFinalized) {
                config.finalizedBlock = 15n;
                hasAdvancedFinalized = true;
              }
            }

            const hasFinalize = messages.some((m) => m._tag === "finalize");
            if (hasFinalize) {
              break;
            }
          }
        })();

        await Promise.race([collectMessages, timeout]);

        const finalizeMsg = messages.find((m) => m._tag === "finalize");
        expect(finalizeMsg).toBeDefined();

        if (finalizeMsg && finalizeMsg._tag === "finalize") {
          expect(finalizeMsg.finalize.cursor?.orderKey).toBe(15n);
        }
      },
    );
  });

  describe("error handling", () => {
    it("retries on fetchFinalizedRange error", { timeout: 10000 }, async () => {
      config.finalizedBlock = 20n;
      config.headBlock = 30n;

      let callCount = 0;
      const originalFetch = config.fetchFinalizedRange.bind(config);
      config.fetchFinalizedRange = async (...args) => {
        callCount++;
        if (callCount === 1) {
          throw new Error("Network error");
        }
        return originalFetch(...args);
      };

      client = new RpcClient(config);

      const request: StreamDataRequest<TestFilter> = {
        finality: "finalized",
        filter: [],
      };

      const messages: StreamDataResponse<TestBlock>[] = [];
      const stream = client.streamData(request);

      for await (const msg of stream) {
        messages.push(msg);

        // Stop after first successful batch
        if (msg._tag === "data" && msg.data.endCursor.orderKey > 0n) {
          break;
        }
      }

      // Should have error message
      const errorMsg = messages.find(
        (m) =>
          m._tag === "systemMessage" &&
          m.systemMessage.output._tag === "stderr" &&
          m.systemMessage.output.stderr.includes("Network error"),
      );
      expect(errorMsg).toBeDefined();

      // should recover with data
      const dataMsg = messages.find((m) => m._tag === "data");
      expect(dataMsg).toBeDefined();

      expect(callCount).toBeGreaterThanOrEqual(2);
    });

    it(
      "retries on fetchBlock error in live stream",
      { timeout: 10000 },
      async () => {
        config.finalizedBlock = 5n;
        config.headBlock = 10n;

        let blockFetchCount = 0;
        const originalFetchBlock = config.fetchBlock.bind(config);
        config.fetchBlock = async (blockNumber, filter) => {
          // fail on first fetchBlock call (live stream phase)
          blockFetchCount++;
          if (blockFetchCount === 1) {
            throw new Error("RPC timeout");
          }
          return originalFetchBlock(blockNumber, filter);
        };

        client = new RpcClient(config);

        const request: StreamDataRequest<TestFilter> = {
          finality: "accepted",
          filter: [],
          startingCursor: { orderKey: 4n },
        };

        const messages: StreamDataResponse<TestBlock>[] = [];
        const stream = client.streamData(request);

        for await (const msg of stream) {
          messages.push(msg);

          if (
            msg._tag === "data" &&
            msg.data.endCursor.orderKey >= 8n &&
            msg.data.production === "live"
          ) {
            break;
          }
        }

        const errorMsg = messages.find(
          (m) =>
            m._tag === "systemMessage" &&
            m.systemMessage.output._tag === "stderr",
        );
        expect(errorMsg).toBeDefined();

        // should recover and streamed live data
        const liveData = messages.filter(
          (m) => m._tag === "data" && m.data.production === "live",
        );
        expect(liveData.length).toBeGreaterThan(0);
      },
    );
  });

  describe("gap handling", () => {
    it(
      "catches up when finalized advances during backfill",
      { timeout: 2000 },
      async () => {
        config.finalizedBlock = 10n;
        config.headBlock = 30n;

        // Simulate finalized advancing while backfilling
        let backfillCallCount = 0;
        const originalFetchRange = config.fetchFinalizedRange.bind(config);
        config.fetchFinalizedRange = async (...args) => {
          backfillCallCount++;
          // after first batch, advance finalized
          if (backfillCallCount === 2) {
            config.finalizedBlock = 25n;
          }
          return originalFetchRange(...args);
        };

        client = new RpcClient(config);

        const request: StreamDataRequest<TestFilter> = {
          finality: "finalized",
          filter: [],
        };

        const messages: StreamDataResponse<TestBlock>[] = [];
        const stream = client.streamData(request);

        for await (const msg of stream) {
          messages.push(msg);
          if (msg._tag === "data" && msg.data.endCursor.orderKey >= 25n) {
            break;
          }
        }

        const dataMessages = messages.filter((m) => m._tag === "data");
        expect(dataMessages.length).toBeGreaterThan(0);

        const cursors = dataMessages
          .map((m) => (m._tag === "data" ? m.data.endCursor?.orderKey : null))
          .filter((c) => c !== null);

        cursors.sort((a, b) => Number(a! - b!));

        // Verify no large gaps
        for (let i = 1; i < cursors.length; i++) {
          const gap = cursors[i]! - cursors[i - 1]!;
          expect(gap).toBeLessThanOrEqual(10n);
        }

        expect(cursors[cursors.length - 1]).toBeGreaterThanOrEqual(25n);
      },
    );
  });
});
