import { describe, expect, it } from "vitest";
import type { Bytes } from "../src/common";
import { createChainTracker } from "../src/rpc/chain-tracker";
import type { BlockInfo, FetchCursorRangeArgs } from "../src/rpc/config";

/**
 * A chain where every block hash is derived from its number, so that two chains
 * can be told apart by giving them a different `fork` label.
 */
class TestChain {
  constructor(
    readonly fork = "a",
    readonly forkedAt = 0n,
  ) {}

  hash(blockNumber: bigint): Bytes {
    if (blockNumber < this.forkedAt) {
      return `0x${blockNumber.toString(16).padStart(8, "0")}a`;
    }
    return `0x${blockNumber.toString(16).padStart(8, "0")}${this.fork}`;
  }

  block(blockNumber: bigint): BlockInfo {
    return {
      blockNumber,
      blockHash: this.hash(blockNumber),
      parentBlockHash: this.hash(blockNumber - 1n),
    };
  }

  fetchCursorByHash = async (blockHash: Bytes): Promise<BlockInfo | null> => {
    const blockNumber = BigInt(`0x${blockHash.slice(2, -1)}`);
    return this.block(blockNumber);
  };

  /** Every range this chain was asked for, so tests can count requests. */
  readonly rangeCalls: FetchCursorRangeArgs[] = [];
  /** Every hash this chain was asked for. */
  readonly hashCalls: Bytes[] = [];

  fetchCursorByHashCounted = async (
    blockHash: Bytes,
  ): Promise<BlockInfo | null> => {
    this.hashCalls.push(blockHash);
    return this.fetchCursorByHash(blockHash);
  };

  fetchCursorRange = async (
    args: FetchCursorRangeArgs,
  ): Promise<BlockInfo[]> => {
    this.rangeCalls.push(args);
    const blocks: BlockInfo[] = [];
    for (let bn = args.startBlockNumber; bn <= args.endBlockNumber; bn++) {
      blocks.push(this.block(bn));
    }
    return blocks;
  };

  /** Total blocks the tracker asked this chain for. */
  get blocksFetched(): number {
    return (
      this.rangeCalls.reduce(
        (total, { startBlockNumber, endBlockNumber }) =>
          total + Number(endBlockNumber - startBlockNumber + 1n),
        0,
      ) + this.hashCalls.length
    );
  }
}

function tracker(chain: TestChain, head: bigint, finalized: bigint) {
  return createChainTracker({
    head: chain.block(head),
    finalized: chain.block(finalized),
    batchSize: 20n,
  });
}

describe("ChainTracker.updateFinalized", () => {
  it("ignores a finalized block older than the one it already has", () => {
    const chain = new TestChain();
    const ct = tracker(chain, 100n, 98n);

    expect(ct.updateFinalized(chain.block(99n))).toBe(true);
    // A lagging node answers with the previous finalized block.
    expect(ct.updateFinalized(chain.block(98n))).toBe(false);
    expect(ct.finalized().orderKey).toBe(99n);
  });

  it("still rejects a different finalized block at the same height", () => {
    const chain = new TestChain();
    const ct = tracker(chain, 100n, 98n);
    const other = new TestChain("b", 0n);

    expect(() => ct.updateFinalized(other.block(98n))).toThrowError(
      "Received a different finalized cursor",
    );
  });

  it("adopts a finalized block that is ahead of the tracked head", async () => {
    // Chains that finalize faster than the head refresh interval regularly
    // report a finalized block ahead of the head the tracker still holds.
    const chain = new TestChain();
    const ct = tracker(chain, 100n, 98n);

    expect(ct.updateFinalized(chain.block(106n))).toBe(true);
    expect(ct.head().orderKey).toBe(106n);

    // The head must still connect to the canonical chain afterwards.
    const result = await ct.updateHead({
      newHead: chain.block(109n),
      fetchCursorByHash: chain.fetchCursorByHash,
      fetchCursorRange: chain.fetchCursorRange,
    });

    expect(result.status).toBe("success");
    expect(ct.head().orderKey).toBe(109n);
  });
});

describe("ChainTracker.updateHead request count", () => {
  it("fetches one block when the head advances by many", async () => {
    const chain = new TestChain();
    const ct = tracker(chain, 100n, 98n);

    const result = await ct.updateHead({
      newHead: chain.block(120n),
      fetchCursorByHash: chain.fetchCursorByHashCounted,
      fetchCursorRange: chain.fetchCursorRange,
    });

    expect(result.status).toBe("success");
    expect(ct.head().orderKey).toBe(120n);

    // One lookup, at the old head's height, rather than one per block in
    // between.
    expect(chain.rangeCalls).toEqual([
      { startBlockNumber: 100n, endBlockNumber: 100n },
    ]);
    expect(chain.blocksFetched).toBe(1);
  });

  it("costs the same whether the head advances by 2 blocks or by 2000", async () => {
    const near = new TestChain();
    const nearTracker = tracker(near, 100n, 98n);
    await nearTracker.updateHead({
      newHead: near.block(102n),
      fetchCursorByHash: near.fetchCursorByHashCounted,
      fetchCursorRange: near.fetchCursorRange,
    });

    const far = new TestChain();
    const farTracker = tracker(far, 100n, 98n);
    await farTracker.updateHead({
      newHead: far.block(2100n),
      fetchCursorByHash: far.fetchCursorByHashCounted,
      fetchCursorRange: far.fetchCursorRange,
    });

    expect(near.blocksFetched).toBe(1);
    expect(far.blocksFetched).toBe(1);
  });

  it("walks back from the fork rather than from the new head on a reorg", async () => {
    const chain = new TestChain();
    const ct = tracker(chain, 100n, 98n);

    for (const blockNumber of [101n, 102n]) {
      await ct.updateHead({
        newHead: chain.block(blockNumber),
        fetchCursorByHash: chain.fetchCursorByHashCounted,
        fetchCursorRange: chain.fetchCursorRange,
      });
    }

    // The chain forks at 101 and the new head is 3 blocks past the old one.
    const forked = new TestChain("b", 101n);
    const result = await ct.updateHead({
      newHead: forked.block(105n),
      fetchCursorByHash: forked.fetchCursorByHashCounted,
      fetchCursorRange: forked.fetchCursorRange,
    });

    expect(result).toEqual({
      status: "reorg",
      cursor: { orderKey: 100n, uniqueKey: chain.hash(100n) },
    });

    // One lookup at the old head's height, then one step back to the ancestor.
    // The blocks between the old head and the new one are never fetched.
    expect(forked.rangeCalls).toEqual([
      { startBlockNumber: 102n, endBlockNumber: 102n },
    ]);
    expect(forked.hashCalls).toHaveLength(1);
  });

  it("does not fetch anything when the head advances by one", async () => {
    const chain = new TestChain();
    const ct = tracker(chain, 100n, 98n);

    await ct.updateHead({
      newHead: chain.block(101n),
      fetchCursorByHash: chain.fetchCursorByHashCounted,
      fetchCursorRange: chain.fetchCursorRange,
    });

    expect(chain.blocksFetched).toBe(0);
  });
});

describe("ChainTracker.updateHead", () => {
  it("advances one block at a time", async () => {
    const chain = new TestChain();
    const ct = tracker(chain, 100n, 98n);

    const result = await ct.updateHead({
      newHead: chain.block(101n),
      fetchCursorByHash: chain.fetchCursorByHash,
      fetchCursorRange: chain.fetchCursorRange,
    });

    expect(result.status).toBe("success");
    expect(ct.head().orderKey).toBe(101n);
  });

  it("reports unchanged when the head is the same", async () => {
    const chain = new TestChain();
    const ct = tracker(chain, 100n, 98n);

    const result = await ct.updateHead({
      newHead: chain.block(100n),
      fetchCursorByHash: chain.fetchCursorByHash,
      fetchCursorRange: chain.fetchCursorRange,
    });

    expect(result.status).toBe("unchanged");
  });

  it("recovers from a reorg on a longer chain instead of throwing", async () => {
    const chain = new TestChain();
    const ct = tracker(chain, 100n, 98n);

    // Blocks 101 and 102 are seen on the original chain.
    await ct.updateHead({
      newHead: chain.block(101n),
      fetchCursorByHash: chain.fetchCursorByHash,
      fetchCursorRange: chain.fetchCursorRange,
    });
    await ct.updateHead({
      newHead: chain.block(102n),
      fetchCursorByHash: chain.fetchCursorByHash,
      fetchCursorRange: chain.fetchCursorRange,
    });

    // The chain reorganizes at block 101 and grows past the old head.
    const forked = new TestChain("b", 101n);
    const result = await ct.updateHead({
      newHead: forked.block(105n),
      fetchCursorByHash: forked.fetchCursorByHash,
      fetchCursorRange: forked.fetchCursorRange,
    });

    expect(result).toEqual({
      status: "reorg",
      cursor: { orderKey: 100n, uniqueKey: chain.hash(100n) },
    });
    expect(ct.head().orderKey).toBe(100n);
  });

  it("recovers from a reorg on a shorter chain", async () => {
    const chain = new TestChain();
    const ct = tracker(chain, 99n, 98n);

    for (const blockNumber of [100n, 101n]) {
      await ct.updateHead({
        newHead: chain.block(blockNumber),
        fetchCursorByHash: chain.fetchCursorByHash,
        fetchCursorRange: chain.fetchCursorRange,
      });
    }

    // The chain forks at block 100 and the new head is behind the old one.
    const forked = new TestChain("b", 100n);
    const result = await ct.updateHead({
      newHead: forked.block(100n),
      fetchCursorByHash: forked.fetchCursorByHash,
      fetchCursorRange: forked.fetchCursorRange,
    });

    expect(result).toEqual({
      status: "reorg",
      cursor: { orderKey: 99n, uniqueKey: chain.hash(99n) },
    });
    expect(ct.head().orderKey).toBe(99n);
  });

  it("walks back to the finalized block when nothing in between is known", async () => {
    const chain = new TestChain();
    const ct = tracker(chain, 100n, 98n);

    // The canonical chain is sparse: only 98 and 100 are known, so the walk
    // back has to follow parent hashes until it reaches the finalized block.
    const forked = new TestChain("b", 99n);
    const result = await ct.updateHead({
      newHead: forked.block(103n),
      fetchCursorByHash: forked.fetchCursorByHash,
      fetchCursorRange: forked.fetchCursorRange,
    });

    expect(result).toEqual({
      status: "reorg",
      cursor: { orderKey: 98n, uniqueKey: chain.hash(98n) },
    });
  });

  it("throws when the chain reorganizes below the finalized block", async () => {
    const chain = new TestChain();
    const ct = tracker(chain, 100n, 98n);

    const forked = new TestChain("b", 90n);

    await expect(
      ct.updateHead({
        newHead: forked.block(103n),
        fetchCursorByHash: forked.fetchCursorByHash,
        fetchCursorRange: forked.fetchCursorRange,
      }),
    ).rejects.toThrowError("reorganized below the finalized block");
  });
});
