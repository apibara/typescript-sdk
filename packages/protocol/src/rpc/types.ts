import type { Bytes, Cursor } from "../common";

export type BlockInfo = {
  blockNumber: bigint;
  blockHash: Bytes;
  parentHash: Bytes;
};

export type CanonicalBlock = {
  blockNumber: bigint;
  blockHash: Bytes;
  parentHash: Bytes;
};

export type CanonicalChain = Map<string, CanonicalBlock>;

export type LoopState = {
  cursor: Cursor;
  finalizedCursor: Cursor;
  headCursor: Cursor;
  canonicalChain: CanonicalChain;
  lastHeartbeat: number;
};
