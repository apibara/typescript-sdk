import { fromHex } from "viem";
import type { Bytes, Cursor } from "../common";
import type { BlockInfo, FetchCursorRangeArgs } from "./config";
import { blockInfoToCursor } from "./helpers";

type UpdateHeadArgs = {
  newHead: BlockInfo;
  fetchCursorByHash: (hash: Bytes) => Promise<BlockInfo | null>;
  fetchCursorRange: (args: FetchCursorRangeArgs) => Promise<BlockInfo[]>;
};

type UpdateHeadResult =
  | {
      status: "unchanged";
    }
  | {
      status: "success";
    }
  | {
      status: "reorg";
      cursor: Cursor;
    };

export class ChainTracker {
  #finalized: BlockInfo;
  #head: BlockInfo;
  #canonical: Map<bigint, BlockInfo>;

  constructor({
    head,
    finalized,
  }: {
    finalized: BlockInfo;
    head: BlockInfo;
    /**
     * @deprecated No longer used. `updateHead` connects the two heads with a
     * single lookup, so there is no longer a range of blocks to batch.
     */
    batchSize?: bigint;
  }) {
    this.#finalized = finalized;
    this.#head = head;

    this.#canonical = new Map([
      [finalized.blockNumber, finalized],
      [head.blockNumber, head],
    ]);
  }

  head(): Cursor {
    return blockInfoToCursor(this.#head);
  }

  finalized(): Cursor {
    return blockInfoToCursor(this.#finalized);
  }

  updateFinalized(newFinalized: BlockInfo) {
    // console.log(
    //   `[CT] updateFinalized: new=${newFinalized.blockNumber} old=${this.#finalized.blockNumber}`,
    // );

    if (newFinalized.blockNumber < this.#finalized.blockNumber) {
      // Finalized blocks never revert, so an older answer is a stale view of
      // the chain rather than a change to it. A node that is catching up, or
      // one backend of a load-balanced endpoint, can return one at any time.
      // Ignore it and keep the finalized block we already have.
      return false;
    }

    if (newFinalized.blockNumber === this.#finalized.blockNumber) {
      if (newFinalized.blockHash !== this.#finalized.blockHash) {
        throw new Error("Received a different finalized cursor");
      }

      return false;
    }

    // Delete all blocks that are now finalized.
    for (
      let bn = this.#finalized.blockNumber;
      bn < newFinalized.blockNumber;
      bn++
    ) {
      this.#canonical.delete(bn);
    }

    this.#canonical.set(newFinalized.blockNumber, newFinalized);
    this.#finalized = newFinalized;

    // The head and the finalized block are refreshed on independent intervals,
    // so on a chain that finalizes faster than the head refresh interval the
    // new finalized block can be ahead of the head we are tracking. The loop
    // above then deletes the head's own entry from the canonical chain, and
    // the next call to `updateHead` cannot link the new head to anything.
    //
    // A finalized block is canonical by definition, so adopt it as the head.
    if (newFinalized.blockNumber >= this.#head.blockNumber) {
      this.#head = newFinalized;
    }

    return true;
  }

  addToCanonicalChain({ blockInfo }: { blockInfo: BlockInfo }) {
    // console.log(`[CT] addToCanonicalChain: block=${blockInfo.blockNumber}`);

    const existing = this.#canonical.get(blockInfo.blockNumber);

    if (existing) {
      if (existing.blockHash !== blockInfo.blockHash) {
        throw new Error(
          `Block already exists in canonical chain: previous ${existing.blockHash}, new ${blockInfo.blockHash}`,
        );
      }
    }

    const parent = this.#canonical.get(blockInfo.blockNumber - 1n);
    if (!parent) {
      throw new Error("Parent block not in canonical chain");
    }

    if (parent.blockHash !== blockInfo.parentBlockHash) {
      throw new Error("Parent block hash mismatch.");
    }

    this.#canonical.set(blockInfo.blockNumber, blockInfo);

    // console.log("Canon updated: ", canonical);

    return { status: "success" };
  }

  async updateHead({
    newHead,
    fetchCursorByHash,
    fetchCursorRange,
  }: UpdateHeadArgs): Promise<UpdateHeadResult> {
    // console.log(
    //   `[CT] updateHead: new=${newHead.blockNumber} old=${this.#head.blockNumber}`,
    // );

    // No changes to the chain.
    if (
      newHead.blockNumber === this.#head.blockNumber &&
      newHead.blockHash === this.#head.blockHash
    ) {
      return { status: "unchanged" };
    }

    // Most common case: the new head is the block after the current head.
    if (
      newHead.blockNumber === this.#head.blockNumber + 1n &&
      newHead.parentBlockHash === this.#head.blockHash
    ) {
      this.#canonical.set(newHead.blockNumber, newHead);
      this.#head = newHead;
      return { status: "success" };
    }

    // The new chain is not longer.
    if (newHead.blockNumber <= this.#head.blockNumber) {
      // console.log("head=", this.#head, "newhead=", newHead);
      // Delete all blocks from canonical chain after the new head.
      for (
        let bn = newHead.blockNumber + 1n;
        bn <= this.#head.blockNumber;
        bn++
      ) {
        this.#canonical.delete(bn);
      }

      // Check if the chain was simply shrunk to this block.
      const existing = this.#canonical.get(newHead.blockNumber);
      if (existing && existing.blockHash === newHead.blockHash) {
        this.#head = existing;
        return {
          status: "reorg",
          cursor: blockInfoToCursor(existing),
        };
      }

      return await this.#reconcileToCommonAncestor({
        block: newHead,
        fetchCursorByHash,
      });
    }

    // In all other cases we need to "join" the new head with the existing
    // chain. The new chain is longer and we have to decide whether it extends
    // the chain we know about or replaces part of it.
    //
    // This used to walk every block between the two heads, checking that each
    // one's parent hash matched the block before it. That costs one request
    // per block produced since the last refresh, which on a chain producing
    // blocks faster than the refresh interval is most of the requests the
    // stream makes.
    //
    // One request answers the same question. Ask the chain for the block it
    // now has at the old head's height: the node returns it from the chain
    // that ends at `newHead`, so if it is still the old head then the old head
    // is on that chain and the two are connected. If it is a different block,
    // the chain reorganized at or below the old head and the walk below finds
    // the block the two chains still agree on.

    // console.log(
    //   `[CT] moving from ${this.#head.blockNumber} to ${newHead.blockNumber} (${newHead.blockNumber - this.#head.blockNumber} blocks)`,
    // );

    const [atOldHead] = await fetchCursorRange({
      startBlockNumber: this.#head.blockNumber,
      endBlockNumber: this.#head.blockNumber,
    });

    if (!atOldHead || atOldHead.blockHash !== this.#head.blockHash) {
      // Walk back from the block the new chain has at the old head's height,
      // not from the new head: the two chains diverge at or below that height,
      // so starting there skips the blocks above it, which are on the new
      // chain and cannot be the common ancestor.
      return await this.#reconcileToCommonAncestor({
        block: atOldHead ?? newHead,
        fetchCursorByHash,
      });
    }

    this.#canonical.set(newHead.blockNumber, newHead);
    this.#head = newHead;

    return { status: "success" };
  }

  /**
   * Walks back from a block that does not connect to the canonical chain until
   * it reaches the most recent block the two chains agree on, pruning the
   * blocks that are no longer canonical on the way.
   *
   * The canonical chain is sparse: it only holds the blocks the tracker has
   * seen, so a missing parent is not by itself evidence of a reorg and the walk
   * continues by hash until it meets a block that is present and matches, or
   * reaches the finalized block, which is a common ancestor by definition.
   */
  async #reconcileToCommonAncestor({
    block,
    fetchCursorByHash,
  }: {
    block: BlockInfo;
    fetchCursorByHash: (hash: Bytes) => Promise<BlockInfo | null>;
  }): Promise<UpdateHeadResult> {
    let current = block;

    while (current.blockNumber > this.#finalized.blockNumber) {
      this.#canonical.delete(current.blockNumber);

      const parentBlockNumber = current.blockNumber - 1n;
      const canonicalParent = this.#canonical.get(parentBlockNumber);

      // We found the common ancestor.
      if (
        canonicalParent &&
        canonicalParent.blockHash === current.parentBlockHash
      ) {
        this.#head = canonicalParent;
        return {
          status: "reorg",
          cursor: blockInfoToCursor(canonicalParent),
        };
      }

      if (parentBlockNumber === this.#finalized.blockNumber) {
        if (current.parentBlockHash !== this.#finalized.blockHash) {
          throw new Error(
            "Cannot reconcile new head with canonical chain: the chain reorganized below the finalized block",
          );
        }

        this.#head = this.#finalized;
        return {
          status: "reorg",
          cursor: blockInfoToCursor(this.#finalized),
        };
      }

      const parent = await fetchCursorByHash(current.parentBlockHash);

      if (!parent) {
        throw new Error(
          "Cannot reconcile new head with canonical chain: failed to fetch parent",
        );
      }

      current = parent;
    }

    throw new Error("Cannot reconcile new head with canonical chain.");
  }

  isCanonical({ orderKey, uniqueKey }: Cursor) {
    if (!uniqueKey) {
      return true;
    }

    const block = this.#canonical.get(orderKey);
    if (!block) {
      return true;
    }

    return block.blockHash === uniqueKey;
  }

  async initializeStartingCursor({
    cursor,
    fetchCursor,
  }: {
    cursor: Cursor;
    fetchCursor: (blockNumber: bigint) => Promise<BlockInfo | null>;
  }): Promise<
    | { canonical: true; reason?: undefined; fullCursor: Cursor }
    | { canonical: false; reason: string; fullCursor?: undefined }
  > {
    const head = this.head();
    const finalized = this.finalized();

    if (cursor.orderKey > head.orderKey) {
      return { canonical: false, reason: "cursor is ahead of head" };
    }

    const expectedInfo = await fetchCursor(cursor.orderKey);
    if (!cursor.uniqueKey) {
      if (expectedInfo === null) {
        throw new Error("Failed to initialize canonical cursor");
      }

      if (expectedInfo.blockNumber > finalized.orderKey) {
        this.#canonical.set(expectedInfo.blockNumber, expectedInfo);
      }

      return { canonical: true, fullCursor: blockInfoToCursor(expectedInfo) };
    }

    if (expectedInfo === null) {
      return {
        canonical: false,
        reason: "expected block does not exist",
      };
    }

    const expectedCursor = blockInfoToCursor(expectedInfo);

    // These two checks are redundant, but they are kept to avoid issues with bad config implementations.
    if (!expectedCursor.uniqueKey) {
      return {
        canonical: false,
        reason: "expected cursor has no unique key (hash)",
      };
    }

    if (expectedCursor.orderKey !== cursor.orderKey) {
      return {
        canonical: false,
        reason: "cursor order key does not match expected order key",
      };
    }

    if (
      fromHex(expectedCursor.uniqueKey, "bigint") !==
      fromHex(cursor.uniqueKey, "bigint")
    ) {
      return {
        canonical: false,
        reason: `cursor hash does not match expected hash: ${cursor.uniqueKey} !== ${expectedCursor.uniqueKey}`,
      };
    }

    if (expectedInfo.blockNumber > finalized.orderKey) {
      this.#canonical.set(expectedInfo.blockNumber, expectedInfo);
    }

    return { canonical: true, fullCursor: expectedCursor };
  }
}

export function createChainTracker({
  head,
  finalized,
}: {
  head: BlockInfo;
  finalized: BlockInfo;
  /**
   * @deprecated No longer used. `updateHead` connects the two heads with a
   * single lookup, so there is no longer a range of blocks to batch.
   */
  batchSize?: bigint;
}): ChainTracker {
  return new ChainTracker({ finalized, head });
}
