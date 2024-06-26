import { Schema } from "@effect/schema";
import { Address, B256 } from "@apibara/evm";

import * as proto from "./proto";

export const ExecutionPayload = Schema.Struct({
  parentHash: Schema.optional(B256),
  feeRecipient: Schema.optional(Address),
  stateRoot: Schema.optional(B256),
  receiptsRoot: Schema.optional(B256),
  // TODO: logs bloom
  prevRandao: Schema.optional(B256),
  blockNumber: Schema.BigIntFromSelf,
  timestamp: Schema.optional(Schema.DateFromSelf),
});

export type ExecutionPayload = typeof ExecutionPayload.Type;

export const BlockHeader = Schema.Struct({
  slot: Schema.BigIntFromSelf,
  proposerIndex: Schema.Number,
  parentRoot: Schema.optional(B256),
  stateRoot: Schema.optional(B256),
  // TODO: randao reveal
  depositCount: Schema.BigIntFromSelf,
  depositRoot: Schema.optional(B256),
  blockHash: Schema.optional(B256),
  graffiti: Schema.optional(B256),
  executionPayload: Schema.optional(ExecutionPayload),
  // TODO: blob kzg commitments
});

export type BlockHeader = typeof BlockHeader.Type;

export const Block = Schema.Struct({
  header: Schema.optional(BlockHeader),
});

export type Block = typeof Block.Type;

export const BlockFromBytes = Schema.transform(
  Schema.Uint8ArrayFromSelf,
  Block,
  {
    strict: false,
    decode(value) {
      return proto.data.Block.decode(value);
    },
    encode(value) {
      return proto.data.Block.encode(value).finish();
    },
  },
);
