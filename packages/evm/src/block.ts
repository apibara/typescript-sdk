import { Bytes, BytesFromUint8Array } from "@apibara/protocol";
import { Schema } from "@effect/schema";

import { Address, B256, U128, U256 } from "./common";
import * as proto from "./proto";

export const Bloom = Schema.transform(
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

export const TransactionStatus = Schema.transform(
  Schema.Enums(proto.data.TransactionStatus),
  Schema.Literal("unknown", "succeeded", "reverted"),
  {
    decode(value) {
      const enumMap = {
        [proto.data.TransactionStatus.SUCCEEDED]: "succeeded",
        [proto.data.TransactionStatus.REVERTED]: "reverted",
        [proto.data.TransactionStatus.UNSPECIFIED]: "unknown",
        [proto.data.TransactionStatus.UNRECOGNIZED]: "unknown",
      } as const;

      return enumMap[value] ?? "unknown";
    },
    encode(value) {
      throw new Error("encode: not implemented");
    },
  },
);

export type TransactionStatus = typeof TransactionStatus.Type;

export const BlockHeader = Schema.Struct({
  blockNumber: Schema.BigIntFromSelf,
  blockHash: Schema.optional(B256),
  parentBlockHash: Schema.optional(B256),
  unclesHash: Schema.optional(B256),
  miner: Schema.optional(Address),
  stateRoot: Schema.optional(B256),
  transactionsRoot: Schema.optional(B256),
  receiptsRoot: Schema.optional(B256),
  logsBloom: Schema.optional(Bloom),
  difficulty: Schema.optional(U256),
  gasLimit: Schema.optional(U128),
  gasUsed: Schema.optional(U128),
  timestamp: Schema.optional(Schema.DateFromSelf),
  extraData: BytesFromUint8Array,
  mixHash: Schema.optional(B256),
  nonce: Schema.optional(Schema.BigIntFromSelf),
  baseFeePerGas: Schema.optional(U128),
  withdrawalsRoot: Schema.optional(B256),
  totalDifficulty: Schema.optional(U256),
  blobGasUsed: Schema.optional(U128),
  excessBlobGas: Schema.optional(U128),
  parentBeaconBlockRoot: Schema.optional(B256),
});

export type BlockHeader = typeof BlockHeader.Type;

export const Withdrawal = Schema.Struct({
  filterIds: Schema.optional(Schema.Array(Schema.Number)),
  withdrawalIndex: Schema.Number,
  index: Schema.BigIntFromSelf,
  validatorIndex: Schema.Number,
  address: Schema.optional(Address),
  amount: Schema.optional(Schema.BigIntFromSelf),
});

export const AccessListItem = Schema.Struct({
  address: Schema.optional(Address),
  storageKeys: Schema.Array(B256),
});

export const Signature = Schema.Struct({
  r: Schema.optional(U256),
  s: Schema.optional(U256),
  v: Schema.optional(U256),
  YParity: Schema.optional(Schema.Boolean),
});

export const Transaction = Schema.Struct({
  filterIds: Schema.optional(Schema.Array(Schema.Number)),
  transactionIndex: Schema.Number,
  transactionHash: Schema.optional(B256),
  nonce: Schema.optional(Schema.BigIntFromSelf),
  from: Schema.optional(Address),
  to: Schema.optional(Address),
  value: Schema.optional(U256),
  gasPrice: Schema.optional(U128),
  gas: Schema.optional(U128),
  maxFeePerGas: Schema.optional(U128),
  maxPriorityFeePerGas: Schema.optional(U128),
  input: BytesFromUint8Array,
  signature: Schema.optional(Signature),
  chainId: Schema.optional(Schema.BigIntFromSelf),
  accessList: Schema.Array(AccessListItem),
  transactionType: Schema.optional(Schema.BigIntFromSelf),
  maxFeePerBlobGas: Schema.optional(U128),
  blobVersionedHashes: Schema.Array(B256),
  transactionStatus: Schema.optional(TransactionStatus),
});

export const TransactionReceipt = Schema.Struct({
  filterIds: Schema.optional(Schema.Array(Schema.Number)),
  transactionIndex: Schema.optional(Schema.Number),
  transactionHash: Schema.optional(B256),
  cumulativeGasUsed: Schema.optional(U128),
  gasUsed: Schema.optional(U128),
  effectiveGasPrice: Schema.optional(U128),
  from: Schema.optional(Address),
  to: Schema.optional(Address),
  contractAddress: Schema.optional(Address),
  logsBloom: Schema.optional(Bloom),
  transactionType: Schema.optional(Schema.BigIntFromSelf),
  blobGasUsed: Schema.optional(U128),
  blobGasPrice: Schema.optional(U128),
  transactionStatus: Schema.optional(TransactionStatus),
});

export const Log = Schema.Struct({
  filterIds: Schema.optional(Schema.Array(Schema.Number)),
  address: Schema.optional(Address),
  topics: Schema.Array(B256),
  data: BytesFromUint8Array,
  logIndex: Schema.Number,
  transactionIndex: Schema.Number,
  transactionHash: Schema.optional(B256),
  transactionStatus: Schema.optional(TransactionStatus),
});

export type Log = typeof Log.Type;

export const Block = Schema.Struct({
  header: Schema.optional(BlockHeader),
  withdrawals: Schema.Array(Withdrawal),
  transactions: Schema.Array(Transaction),
  receipts: Schema.Array(TransactionReceipt),
  logs: Schema.Array(Log),
});

export type Block = typeof Block.Type;

export const BlockFromBytes = Schema.transform(
  Schema.Uint8ArrayFromSelf,
  Schema.NullOr(Block),
  {
    strict: false,
    decode(value) {
      if (value.length === 0) {
        return null;
      }
      return proto.data.Block.decode(value);
    },
    encode(value) {
      if (value === null) {
        return new Uint8Array();
      }
      return proto.data.Block.encode(value).finish();
    },
  },
);
