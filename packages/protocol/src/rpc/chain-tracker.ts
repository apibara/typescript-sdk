import { fromHex } from "viem";
import type { Bytes, Cursor } from "../common";
import type { BlockInfo } from "./config";
import { blockInfoToCursor } from "./helpers";

type UpdateHeadArgs = {
  newHead: BlockInfo;
  fetchCursorByHash: (hash: Bytes) => Promise<BlockInfo | null>;
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

  constructor({ head, finalized }: { finalized: BlockInfo; head: BlockInfo }) {
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
    if (newFinalized.blockNumber < this.#finalized.blockNumber) {
      throw new Error("Finalized cursor moved backwards");
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

    return true;
  }

  addToCanonicalChain(blockInfo: BlockInfo) {
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
      throw new Error("Parent block not found");
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
  }: UpdateHeadArgs): Promise<UpdateHeadResult> {
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
      let currentNewHead = newHead;
      // Delete all blocks from canonical chain after the new head.
      for (
        let bn = newHead.blockNumber + 1n;
        bn <= this.#head.blockNumber;
        bn++
      ) {
        this.#canonical.delete(bn);
      }

      // Check if the chain was simply shrunk to this block.
      const existing = this.#canonical.get(currentNewHead.blockNumber);
      if (existing && existing.blockHash === currentNewHead.blockHash) {
        this.#head = existing;
        return {
          status: "reorg",
          cursor: blockInfoToCursor(existing),
        };
      }

      while (currentNewHead.blockNumber > this.#finalized.blockNumber) {
        this.#canonical.delete(currentNewHead.blockNumber);

        const canonicalParent = this.#canonical.get(
          currentNewHead.blockNumber - 1n,
        );

        if (!canonicalParent) {
          throw new Error(
            "Cannot reconcile new head with canonical chain: missing parent in canonical chain",
          );
        }

        // We found the common ancestor.
        if (canonicalParent.blockHash === currentNewHead.parentBlockHash) {
          this.#head = canonicalParent;
          return {
            status: "reorg",
            cursor: blockInfoToCursor(canonicalParent),
          };
        }

        const parent = await fetchCursorByHash(currentNewHead.parentBlockHash);

        if (!parent) {
          throw new Error(
            "Cannot reconcile new head with canonical chain: failed to fetch parent",
          );
        }

        currentNewHead = parent;
      }

      throw new Error("Cannot reconcile new head with canonical chain.");
    }

    // In all other cases we need to "join" the new head with the existing chain.
    // The new chain is longer and we need the missing blocks.
    // This may result in reorgs.

    let current = newHead;
    let reorgDetected = false;
    const blocksToApply = [newHead];

    while (true) {
      const parent = await fetchCursorByHash(current.parentBlockHash);

      if (!parent) {
        throw new Error(
          "Cannot reconcile new head with canonical chain: failed to fetch parent",
        );
      }

      if (parent.blockNumber === this.#head.blockNumber) {
        if (parent.blockHash === this.#head.blockHash) {
          break;
        }

        const headParent = this.#canonical.get(this.#head.blockNumber - 1n);
        if (!headParent) {
          throw new Error(
            "Cannot reconcile new head with canonical chain: missing parent in canonical chain",
          );
        }

        // Update current head.
        this.#canonical.delete(this.#head.blockNumber);
        this.#head = headParent;
        reorgDetected = true;
      }

      blocksToApply.push(parent);
      current = parent;
    }

    for (const block of blocksToApply.reverse()) {
      this.#canonical.set(block.blockNumber, block);
    }

    const previousHead = this.#head;
    this.#head = newHead;

    if (reorgDetected) {
      return {
        status: "reorg",
        cursor: blockInfoToCursor(previousHead),
      };
    }

    return { status: "success" };
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
    if (cursor.orderKey > head.orderKey) {
      return { canonical: false, reason: "cursor is ahead of head" };
    }

    if (!cursor.uniqueKey) {
      const fullInfo = await fetchCursor(cursor.orderKey);

      if (fullInfo === null) {
        throw new Error("Failed to initialize canonical cursor");
      }

      return { canonical: true, fullCursor: blockInfoToCursor(fullInfo) };
    }

    const expectedInfo = await fetchCursor(cursor.orderKey);

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

    return { canonical: true, fullCursor: expectedCursor };
  }
}

export function createChainTracker({
  head,
  finalized,
}: {
  head: BlockInfo;
  finalized: BlockInfo;
}): ChainTracker {
  return new ChainTracker({ finalized, head });
}
