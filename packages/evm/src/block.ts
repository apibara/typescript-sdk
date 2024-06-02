import { Schema } from "@effect/schema";
import { Bytes, BytesFromUint8Array } from "@apibara/protocol";

import * as proto from "./proto";
import { Address, B256 } from "./common";

export const HexData = Schema.transform(
  Schema.Struct({
    value: BytesFromUint8Array,
  }),
  Bytes,
  {
    strict: false,
    encode(value) {
      throw new Error("Not implemented");
    },
    decode({ value }) {
      return value;
    },
  },
);

export const BlockHeader = Schema.Struct({
  number: Schema.BigIntFromSelf,
  hash: Schema.optional(B256),
  parentHash: Schema.optional(B256),
  uncleHash: Schema.optional(B256),
  miner: Schema.optional(Address),
  stateRoot: Schema.optional(B256),
  transactionRoot: Schema.optional(B256),
  receiptRoot: Schema.optional(B256),
  // TODO: logsBloom, etc.
  nonce: Schema.BigIntFromSelf,
  // TODO.
  uncles: Schema.Array(B256),
  // TODO.
  blobGasUsed: Schema.BigIntFromSelf,
  excessBlobGas: Schema.BigIntFromSelf,
});

export type BlockHeader = typeof BlockHeader.Type;

export const Withdrawal = Schema.Struct({
  index: Schema.BigIntFromSelf,
  validatorIndex: Schema.BigIntFromSelf,
  withdrawalIndex: Schema.BigIntFromSelf,
  address: Schema.optional(Address),
});

export const AccessListItem = Schema.Struct({
  // TODO: fields.
  storageKeys: Schema.Array(B256),
});

export const Transaction = Schema.Struct({
  // TODO: fields.
  nonce: Schema.BigIntFromSelf,
  transactionIndex: Schema.BigIntFromSelf,
  chainId: Schema.BigIntFromSelf,
  accessList: Schema.Array(AccessListItem),
  transactionType: Schema.BigIntFromSelf,
  blobVersionedHashes: Schema.Array(B256),
});

export const TransactionReceipt = Schema.Struct({
  // TODO: fields.
  transactionIndex: Schema.BigIntFromSelf,
  statusCode: Schema.BigIntFromSelf,
  transactionType: Schema.BigIntFromSelf,
});

export const Log = Schema.Struct({
  address: Schema.optional(Address),
  topics: Schema.Array(B256),
  data: HexData,
  logIndex: Schema.BigIntFromSelf,
  transactionIndex: Schema.BigIntFromSelf,
});

export type Log = typeof Log.Type;

export const Block = Schema.Struct({
  header: Schema.optional(BlockHeader),
  withdrawals: Schema.Array(Withdrawal),
  transactions: Schema.Array(Transaction),
  receipts: Schema.Array(TransactionReceipt),
  logs: Schema.Array(Log),
});

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
