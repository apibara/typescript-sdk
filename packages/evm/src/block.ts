import { Bytes, BytesFromUint8Array } from "@apibara/protocol";
import { Schema } from "@effect/schema";

import { Address, B256, U128, U256 } from "./common";
import * as proto from "./proto";

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
      // return value;
      throw new Error("Not implemented");
    },
  },
);

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
      throw new Error("Not implemented");
      // return value;
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
  logsBloom: Schema.optional(Bloom),
  difficulty: Schema.optional(U256),
  gasLimit: Schema.optional(U256),
  gasUsed: Schema.optional(U256),
  timestamp: Schema.optional(Schema.DateFromSelf),
  // extraData: Schema.optional(HexData),
  mixHash: Schema.optional(B256),
  nonce: Schema.BigIntFromSelf,
  baseFeePerGas: Schema.optional(U256),
  withdrawalsRoot: Schema.optional(B256),
  totalDifficulty: Schema.optional(U256),
  uncles: Schema.Array(B256),
  size: Schema.optional(U256),
  blobGasUsed: Schema.BigIntFromSelf,
  excessBlobGas: Schema.BigIntFromSelf,
  parentBeaconBlockRoot: Schema.optional(B256),
});

export type BlockHeader = typeof BlockHeader.Type;

export const Withdrawal = Schema.Struct({
  index: Schema.BigIntFromSelf,
  validatorIndex: Schema.BigIntFromSelf,
  withdrawalIndex: Schema.BigIntFromSelf,
  address: Schema.optional(Address),
  amount: Schema.optional(U256),
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
  hash: Schema.optional(B256),
  nonce: Schema.BigIntFromSelf,
  transactionIndex: Schema.BigIntFromSelf,
  from: Schema.optional(Address),
  to: Schema.optional(Address),
  value: Schema.optional(U256),
  gasPrice: Schema.optional(U128),
  gas: Schema.optional(U256),
  maxFeePerGas: Schema.optional(U128),
  maxPriorityFeePerGas: Schema.optional(U128),
  // TODO
  // input: Schema.optional(HexData),
  signature: Schema.optional(Signature),
  chainId: Schema.BigIntFromSelf,
  accessList: Schema.Array(AccessListItem),
  transactionType: Schema.BigIntFromSelf,
  maxFeePerBlobGas: Schema.optional(U128),
  blobVersionedHashes: Schema.Array(B256),
});

export const TransactionReceipt = Schema.Struct({
  transactionHash: Schema.optional(B256),
  transactionIndex: Schema.BigIntFromSelf,
  cumulativeGasUsed: Schema.optional(U256),
  gasUsed: Schema.optional(U256),
  effectiveGasPrice: Schema.optional(U128),
  from: Schema.optional(Address),
  to: Schema.optional(Address),
  contractAddress: Schema.optional(Address),
  logsBloom: Schema.optional(Bloom),
  statusCode: Schema.BigIntFromSelf,
  transactionType: Schema.BigIntFromSelf,
  blobGasUsed: Schema.optional(U128),
  blobGasPrice: Schema.optional(U128),
});

export const Log = Schema.Struct({
  address: Schema.optional(Address),
  topics: Schema.Array(B256),
  // TODO
  // data: Bytes,
  logIndex: Schema.BigIntFromSelf,
  transactionIndex: Schema.BigIntFromSelf,
  transactionHash: Schema.optional(B256),
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
