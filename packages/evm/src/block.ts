import { Bytes, BytesFromUint8Array } from "@apibara/protocol";
import { Schema } from "@effect/schema";

import { Address, B256, U128, U256 } from "./common";
import { tag } from "./helpers";
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

export type Bloom = typeof Bloom.Type;

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
  requestsHash: Schema.optional(B256),
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

export type Withdrawal = typeof Withdrawal.Type;

export const AccessListItem = Schema.Struct({
  address: Address,
  storageKeys: Schema.Array(B256),
});

export type AccessListItem = typeof AccessListItem.Type;

export const Signature = Schema.Struct({
  r: U256,
  s: U256,
  v: Schema.optional(U256),
  YParity: Schema.optional(Schema.Boolean),
});

export type Signature = typeof Signature.Type;

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

export type Transaction = typeof Transaction.Type;

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

export type TransactionReceipt = typeof TransactionReceipt.Type;

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

export const CallType = Schema.transform(
  Schema.Enums(proto.data.CallType),
  Schema.Literal(
    "unknown",
    "call",
    "delegateCall",
    "callCode",
    "delegateCall",
    "staticCall",
    "authCall",
  ),
  {
    decode(value) {
      const enumMap = {
        [proto.data.CallType.CALL]: "call",
        [proto.data.CallType.CALL_CODE]: "callCode",
        [proto.data.CallType.DELEGATE_CALL]: "delegateCall",
        [proto.data.CallType.STATIC_CALL]: "staticCall",
        [proto.data.CallType.AUTH_CALL]: "authCall",
        [proto.data.CallType.UNSPECIFIED]: "unknown",
        [proto.data.CallType.UNRECOGNIZED]: "unknown",
      } as const;

      return enumMap[value] ?? "unknown";
    },
    encode(value) {
      throw new Error("encode: not implemented");
    },
  },
);

export type CallType = typeof CallType.Type;

export const CreationMethod = Schema.transform(
  Schema.Enums(proto.data.CreationMethod),
  Schema.Literal("unknown", "create", "create2", "eofCreate"),
  {
    decode(value) {
      const enumMap = {
        [proto.data.CreationMethod.CREATE]: "create",
        [proto.data.CreationMethod.CREATE2]: "create2",
        [proto.data.CreationMethod.EOF_CREATE]: "eofCreate",
        [proto.data.CallType.UNSPECIFIED]: "unknown",
        [proto.data.CallType.UNRECOGNIZED]: "unknown",
      } as const;

      return enumMap[value] ?? "unknown";
    },
    encode(value) {
      throw new Error("encode: not implemented");
    },
  },
);

export type CreationMethod = typeof CreationMethod.Type;

export const CallAction = Schema.Struct({
  _tag: tag("call"),
  call: Schema.Struct({
    fromAddress: Address,
    type: CallType,
    gas: Schema.BigIntFromSelf,
    input: BytesFromUint8Array,
    toAddress: Address,
    value: U256,
  }),
});

export type CallAction = typeof CallAction.Type;

export const CreateAction = Schema.Struct({
  _tag: tag("create"),
  create: Schema.Struct({
    fromAddress: Address,
    gas: Schema.BigIntFromSelf,
    init: BytesFromUint8Array,
    value: U256,
    creationMethod: CreationMethod,
  }),
});

export type CreateAction = typeof CreateAction.Type;

export const SelfDestructAction = Schema.Struct({
  _tag: tag("selfDestruct"),
  selfDestruct: Schema.Struct({
    address: Address,
    balance: U256,
    refundAddress: Address,
  }),
});

export type SelfDestructAction = typeof SelfDestructAction.Type;

export const RewardType = Schema.transform(
  Schema.Enums(proto.data.RewardType),
  Schema.Literal("unknown", "block", "uncle"),
  {
    decode(value) {
      const enumMap = {
        [proto.data.RewardType.BLOCK]: "block",
        [proto.data.RewardType.UNCLE]: "uncle",
        [proto.data.RewardType.UNSPECIFIED]: "unknown",
        [proto.data.RewardType.UNRECOGNIZED]: "unknown",
      } as const;

      return enumMap[value] ?? "unknown";
    },
    encode(value) {
      throw new Error("encode: not implemented");
    },
  },
);

export type RewardType = typeof RewardType.Type;

export const RewardAction = Schema.Struct({
  _tag: tag("reward"),
  reward: Schema.Struct({
    author: Address,
    type: RewardType,
    value: U256,
  }),
});

export type RewardAction = typeof RewardAction.Type;

export const CallOutput = Schema.Struct({
  _tag: tag("callOutput"),
  callOutput: Schema.Struct({
    gasUsed: Schema.BigIntFromSelf,
    output: BytesFromUint8Array,
  }),
});

export type CallOutput = typeof CallOutput.Type;

export const CreateOutput = Schema.Struct({
  _tag: tag("createOutput"),
  createOutput: Schema.Struct({
    address: Address,
    code: BytesFromUint8Array,
    gasUsed: Schema.BigIntFromSelf,
  }),
});

export type CreateOutput = typeof CreateOutput.Type;

export const Trace = Schema.Struct({
  action: Schema.Union(
    CallAction,
    CreateAction,
    SelfDestructAction,
    RewardAction,
  ),
  error: Schema.optional(Schema.String),
  output: Schema.optional(Schema.Union(CallOutput, CreateOutput)),
  subtraces: Schema.Number,
  traceAddress: Schema.Array(Schema.Number),
});

export type Trace = typeof Trace.Type;

export const TransactionTrace = Schema.Struct({
  filterIds: Schema.Array(Schema.Number),
  transactionIndex: Schema.Number,
  transactionHash: B256,
  traces: Schema.Array(Trace),
});

export type TransactionTrace = typeof TransactionTrace.Type;

export const Block = Schema.Struct({
  header: BlockHeader,
  withdrawals: Schema.Array(Withdrawal),
  transactions: Schema.Array(Transaction),
  receipts: Schema.Array(TransactionReceipt),
  logs: Schema.Array(Log),
  traces: Schema.Array(TransactionTrace),
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
