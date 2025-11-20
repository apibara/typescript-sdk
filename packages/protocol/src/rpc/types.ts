import type { Bytes, Cursor } from "../common";

export type BlockInfo = {
  blockNumber: bigint;
  blockHash: Bytes;
  parentHash: Bytes;
};

export type CanonicalChain = Map<string, BlockInfo>;

export type LoopState = {
  cursor: Cursor;
  finalizedCursor: Cursor;
  headCursor: Cursor;
  canonicalChain: CanonicalChain;
  lastHeartbeat: number;
  blockNumberToHash: Map<bigint, Bytes>;
};

export type FinalizedRangeResult<TBlock> = {
  blocks: (TBlock | null)[];
  startCursor: Cursor;
  endCursor: Cursor;
};
