import { Schema } from "@effect/schema";

import * as proto from "./proto";
import { FieldElement } from "./common";

export const BlockHeader = Schema.Struct({
  blockNumber: Schema.BigIntFromSelf,
  blockHash: Schema.optional(FieldElement),
  parentBlockHash: Schema.optional(FieldElement),
});

export type BlockHeader = typeof BlockHeader.Type;

export const Transaction = Schema.Struct({});
export type Transaction = typeof Transaction.Type;

export const TransactionReceipt = Schema.Struct({});
export type TransactionReceipt = typeof TransactionReceipt.Type;

export const Event = Schema.Struct({});
export type Event = typeof Event.Type;

export const Block = Schema.Struct({
  header: Schema.optional(BlockHeader),
  transactions: Schema.Array(Transaction),
  receipts: Schema.Array(TransactionReceipt),
  events: Schema.Array(Event),
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
