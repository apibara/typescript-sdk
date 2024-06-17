import { Schema } from "@effect/schema";

import * as proto from "./proto";
import { FieldElement } from "./common";

export const BlockHeader = Schema.Struct({
  blockNumber: Schema.BigIntFromSelf,
  blockHash: Schema.optional(FieldElement),
  parentBlockHash: Schema.optional(FieldElement),
  starknetVersion: Schema.optional(Schema.String),
  timestamp: Schema.optional(Schema.DateFromSelf),
});

export type BlockHeader = typeof BlockHeader.Type;

export const TransactionMeta = Schema.Struct({
  transactionIndex: Schema.optional(Schema.Number),
});

export type TransactionMeta = typeof TransactionMeta.Type;

export const Transaction = Schema.Struct({
  meta: Schema.optional(TransactionMeta),
});

export type Transaction = typeof Transaction.Type;

export const TransactionReceipt = Schema.Struct({});

export type TransactionReceipt = typeof TransactionReceipt.Type;

export const Event = Schema.Struct({
  fromAddress: Schema.optional(FieldElement),
  keys: Schema.optional(Schema.Array(FieldElement)),
  eventIndex: Schema.optional(Schema.Number),
});

export type Event = typeof Event.Type;

export const MessageToL1 = Schema.Struct({
  toAddress: Schema.optional(FieldElement),
  messageIndex: Schema.optional(Schema.Number),
});

export type MessageToL1 = typeof MessageToL1.Type;

export const Block = Schema.Struct({
  header: Schema.optional(BlockHeader),
  transactions: Schema.Array(Transaction),
  receipts: Schema.Array(TransactionReceipt),
  events: Schema.Array(Event),
  messages: Schema.Array(MessageToL1),
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
