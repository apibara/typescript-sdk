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
  #batchSize: bigint;

  constructor({
    head,
    finalized,
    batchSize,
  }: {
    finalized: BlockInfo;
    head: BlockInfo;
    batchSize: bigint;
  }) {
    this.#finalized = finalized;
    this.#head = head;
    this.#batchSize = batchSize;

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
    // console.debug(
    //   `updateFinalized: new=${newFinalized.blockNumber} old=${this.#finalized.blockNumber}`,
    // );

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

  addToCanonicalChain({ blockInfo }: { blockInfo: BlockInfo }) {
    // console.debug(`addToCanonicalChain: block=${blockInfo.blockNumber}`);

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
    // console.debug(
    //   `updateHead: new=${newHead.blockNumber} old=${this.#head.blockNumber}`,
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

    // console.log(
    //   `Moving from ${this.#head.blockNumber} to ${newHead.blockNumber} (${newHead.blockNumber - this.#head.blockNumber} blocks)`,
    // );

    let currentBlockNumber = this.#head.blockNumber + 1n;

    while (true) {
      let endBlockNumber = currentBlockNumber + this.#batchSize - 1n;
      if (endBlockNumber > newHead.blockNumber) {
        endBlockNumber = newHead.blockNumber;
      }

      const missing = await fetchCursorRange({
        startBlockNumber: currentBlockNumber,
        endBlockNumber,
      });

      for (const block of missing) {
        const canonicalParent = this.#canonical.get(block.blockNumber - 1n);
        if (
          !canonicalParent ||
          canonicalParent.blockHash !== block.parentBlockHash
        ) {
          throw new Error(
            "Chain reorganization detected. Recovery not implemented",
          );
        }

        this.#canonical.set(block.blockNumber, block);

        // console.log(`Applied block ${block.blockNumber}`);
      }

      if (endBlockNumber === newHead.blockNumber) {
        break;
      }

      currentBlockNumber = endBlockNumber + 1n;
    }

    /*
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
    */
    // throw new Error("FUCK IT");

    // for (const block of blocksToApply.reverse()) {
    //   this.#canonical.set(block.blockNumber, block);
    // }

    // const previousHead = this.#head;
    this.#head = newHead;

    // if (reorgDetected) {
    //   return {
    //     status: "reorg",
    //     cursor: blockInfoToCursor(previousHead),
    //   };
    // }

    return { status: "success" };
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
  batchSize,
}: {
  head: BlockInfo;
  finalized: BlockInfo;
  batchSize: bigint;
}): ChainTracker {
  return new ChainTracker({ finalized, head, batchSize });
}
