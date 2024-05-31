import { Schema } from "@effect/schema";

/*
import { AddressFromMessage, B256, B256FromMessage } from "./common";
import * as proto from "./proto";

export const BlockHeader = Schema.Struct({
  number: Schema.BigIntFromSelf,
  hash: Schema.optional(B256FromMessage),
  parentHash: Schema.optional(B256FromMessage),
  uncleHash: Schema.optional(B256FromMessage),
  miner: Schema.optional(AddressFromMessage),
  stateRoot: Schema.optional(B256FromMessage),
  transactionRoot: Schema.optional(B256FromMessage),
  receiptRoot: Schema.optional(B256FromMessage),
  // TODO: logsBloom, etc.
  nonce: Schema.BigIntFromSelf,
  // TODO.
  uncles: Schema.Array(B256FromMessage),
  // TODO.
  blobGasUsed: Schema.BigIntFromSelf,
  excessBlobGas: Schema.BigIntFromSelf,
});

export type BlockHeader = typeof BlockHeader.Type;

export const Withdrawal = Schema.Struct({
  index: Schema.BigIntFromSelf,
  validatorIndex: Schema.BigIntFromSelf,
  withdrawalIndex: Schema.BigIntFromSelf,
  address: Schema.optional(AddressFromMessage),
});

export const AccessListItem = Schema.Struct({
  // TODO: fields.
  storageKeys: Schema.Array(B256FromMessage),
});

export const Transaction = Schema.Struct({
  // TODO: fields.
  nonce: Schema.BigIntFromSelf,
  transactionIndex: Schema.BigIntFromSelf,
  chainId: Schema.BigIntFromSelf,
  accessList: Schema.Array(AccessListItem),
  transactionType: Schema.BigIntFromSelf,
  blobVersionedHashes: Schema.Array(B256FromMessage),
});

export const TransactionReceipt = Schema.Struct({
  // TODO: fields.
  transactionIndex: Schema.BigIntFromSelf,
  statusCode: Schema.BigIntFromSelf,
  transactionType: Schema.BigIntFromSelf,
});

export const Log = Schema.Struct({
  address: Schema.optional(AddressFromMessage),
  topics: Schema.Array(B256FromMessage),
  logIndex: Schema.BigIntFromSelf,
  transactionIndex: Schema.BigIntFromSelf,
});

export const Block = Schema.Struct({
  header: Schema.optional(BlockHeader),
  withdrawals: Schema.Array(Withdrawal),
  transactions: Schema.Array(Transaction),
  receipts: Schema.Array(TransactionReceipt),
  logs: Schema.Array(Log),
});

export type Block = typeof Block.Type;

const blockToProto = Schema.encodeSync(Block);
const blockFromProto = Schema.decodeSync(Block);

export const BlockFromBytes = Schema.transform(
  Block,
  Schema.Uint8ArrayFromSelf,
  {
    encode(value) {
      const blockProto = proto.data.Block.decode(value);
      return blockFromProto(blockProto);
    },
    decode(value) {
      const blockProto = blockToProto(value);
      return proto.data.Block.encode(blockProto).finish();
    },
  },
);

export const blockFromBytes = Schema.encodeSync(BlockFromBytes);
*/
