import type { Bytes, Cursor } from "../common";

export type BlockInfo = {
  blockNumber: bigint;
  blockHash: Bytes;
  parentHash: Bytes;
};

export type CanonicalBlock = BlockInfo;

export type CanonicalChain = Map<string, CanonicalBlock>;

export type LoopState = {
  cursor: Cursor;
  finalizedCursor: Cursor;
  headCursor: Cursor;
  canonicalChain: CanonicalChain;
  lastHeartbeat: number;
};

export type FinalizedRangeResult<TBlock> = {
  blocks: (TBlock | null)[];
  startCursor: Cursor;
  endCursor: Cursor;
};
