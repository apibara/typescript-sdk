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
  blockHash: B256,
  parentBlockHash: B256,
  unclesHash: B256,
  miner: Address,
  stateRoot: B256,
  transactionsRoot: B256,
  receiptsRoot: B256,
  logsBloom: Bloom,
  difficulty: U256,
  gasLimit: U128,
  gasUsed: U128,
  timestamp: Schema.DateFromSelf,
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
  filterIds: Schema.Array(Schema.Number),
  withdrawalIndex: Schema.Number,
  index: Schema.BigIntFromSelf,
  validatorIndex: Schema.Number,
  address: Address,
  amount: Schema.BigIntFromSelf,
});

export const AccessListItem = Schema.Struct({
  address: Address,
  storageKeys: Schema.Array(B256),
});

export const Signature = Schema.Struct({
  r: U256,
  s: U256,
  v: U256,
  YParity: Schema.optional(Schema.Boolean),
});

export const Transaction = Schema.Struct({
  filterIds: Schema.Array(Schema.Number),
  transactionIndex: Schema.Number,
  transactionHash: B256,
  nonce: Schema.BigIntFromSelf,
  from: Address,
  to: Schema.optional(Address),
  value: U256,
  gasPrice: Schema.optional(U128),
  gas: U128,
  maxFeePerGas: Schema.optional(U128),
  maxPriorityFeePerGas: Schema.optional(U128),
  input: BytesFromUint8Array,
  signature: Schema.optional(Signature),
  chainId: Schema.optional(Schema.BigIntFromSelf),
  accessList: Schema.Array(AccessListItem),
  transactionType: Schema.BigIntFromSelf,
  maxFeePerBlobGas: Schema.optional(U128),
  blobVersionedHashes: Schema.Array(B256),
  transactionStatus: TransactionStatus,
});

export const TransactionReceipt = Schema.Struct({
  filterIds: Schema.Array(Schema.Number),
  transactionIndex: Schema.Number,
  transactionHash: B256,
  cumulativeGasUsed: U128,
  gasUsed: U128,
  effectiveGasPrice: U128,
  from: Address,
  to: Schema.optional(Address),
  contractAddress: Schema.optional(Address),
  logsBloom: Bloom,
  transactionType: Schema.BigIntFromSelf,
  blobGasUsed: Schema.optional(U128),
  blobGasPrice: Schema.optional(U128),
  transactionStatus: TransactionStatus,
});

export const Log = Schema.Struct({
  filterIds: Schema.Array(Schema.Number),
  address: Address,
  topics: Schema.Array(B256),
  data: BytesFromUint8Array,
  logIndex: Schema.Number,
  logIndexInTransaction: Schema.Number,
  transactionIndex: Schema.Number,
  transactionHash: B256,
  transactionStatus: TransactionStatus,
});

export type Log = typeof Log.Type;

export const Block = Schema.Struct({
  header: BlockHeader,
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
