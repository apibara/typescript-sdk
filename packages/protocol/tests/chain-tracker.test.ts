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

  fetchCursorRange = async ({
    startBlockNumber,
    endBlockNumber,
  }: FetchCursorRangeArgs): Promise<BlockInfo[]> => {
    const blocks: BlockInfo[] = [];
    for (let bn = startBlockNumber; bn <= endBlockNumber; bn++) {
      blocks.push(this.block(bn));
    }
    return blocks;
  };
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
