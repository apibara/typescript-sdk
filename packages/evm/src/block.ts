import { BytesFromUint8Array } from "@apibara/protocol";

import {
  ArrayCodec,
  BigIntCodec,
  BooleanCodec,
  type Codec,
  type CodecType,
  DateCodec,
  MessageCodec,
  NumberCodec,
  OneOfCodec,
  OptionalCodec,
  StringCodec,
} from "@apibara/protocol/codec";
import { RequiredCodec } from "@apibara/protocol/codec";
import { Address, B256, U128, U256 } from "./common";
import * as proto from "./proto";

export const Bloom: Codec<
  `0x${string}` | undefined,
  { value?: Uint8Array | undefined }
> = {
  encode(x) {
    return { value: BytesFromUint8Array.encode(x) };
  },
  decode({ value }) {
    return BytesFromUint8Array.decode(value);
  },
};

export type Bloom = CodecType<typeof Bloom>;

export const TransactionStatus: Codec<
  "unknown" | "succeeded" | "reverted",
  proto.data.TransactionStatus
> = {
  encode(x) {
    const enumMap = {
      unknown: proto.data.TransactionStatus.UNSPECIFIED,
      succeeded: proto.data.TransactionStatus.SUCCEEDED,
      reverted: proto.data.TransactionStatus.REVERTED,
    } as const;

    return enumMap[x] ?? proto.data.TransactionStatus.UNSPECIFIED;
  },
  decode(p) {
    const enumMap = {
      [proto.data.TransactionStatus.SUCCEEDED]: "succeeded",
      [proto.data.TransactionStatus.REVERTED]: "reverted",
      [proto.data.TransactionStatus.UNSPECIFIED]: "unknown",
      [proto.data.TransactionStatus.UNRECOGNIZED]: "unknown",
    } as const;

    return enumMap[p] ?? "unknown";
  },
};

export type TransactionStatus = CodecType<typeof TransactionStatus>;

export const BlockHeader = MessageCodec({
  blockNumber: RequiredCodec(BigIntCodec),
  blockHash: OptionalCodec(B256),
  parentBlockHash: RequiredCodec(B256),
  unclesHash: RequiredCodec(B256),
  miner: OptionalCodec(Address),
  stateRoot: RequiredCodec(B256),
  transactionsRoot: RequiredCodec(B256),
  receiptsRoot: RequiredCodec(B256),
  logsBloom: OptionalCodec(Bloom),
  difficulty: RequiredCodec(U256),
  gasLimit: RequiredCodec(U128),
  gasUsed: RequiredCodec(U128),
  timestamp: RequiredCodec(DateCodec),
  extraData: RequiredCodec(BytesFromUint8Array),
  mixHash: OptionalCodec(B256),
  nonce: OptionalCodec(BigIntCodec),
  baseFeePerGas: OptionalCodec(U128),
  withdrawalsRoot: OptionalCodec(B256),
  totalDifficulty: OptionalCodec(U256),
  blobGasUsed: OptionalCodec(U128),
  excessBlobGas: OptionalCodec(U128),
  parentBeaconBlockRoot: OptionalCodec(B256),
  requestsHash: OptionalCodec(B256),
});

export type BlockHeader = CodecType<typeof BlockHeader>;

export const Withdrawal = MessageCodec({
  filterIds: ArrayCodec(NumberCodec),
  withdrawalIndex: RequiredCodec(NumberCodec),
  index: RequiredCodec(BigIntCodec),
  validatorIndex: RequiredCodec(NumberCodec),
  address: RequiredCodec(Address),
  amount: RequiredCodec(BigIntCodec),
});

export type Withdrawal = CodecType<typeof Withdrawal>;

export const AccessListItem = MessageCodec({
  address: RequiredCodec(Address),
  storageKeys: ArrayCodec(B256),
});

export type AccessListItem = CodecType<typeof AccessListItem>;

export const Signature = MessageCodec({
  r: RequiredCodec(U256),
  s: RequiredCodec(U256),
  v: OptionalCodec(U256),
  YParity: OptionalCodec(BooleanCodec),
});

export type Signature = CodecType<typeof Signature>;

export const Transaction = MessageCodec({
  filterIds: ArrayCodec(NumberCodec),
  transactionIndex: RequiredCodec(NumberCodec),
  transactionHash: RequiredCodec(B256),
  nonce: RequiredCodec(BigIntCodec),
  from: RequiredCodec(Address),
  to: OptionalCodec(Address),
  value: RequiredCodec(U256),
  gasPrice: OptionalCodec(U128),
  gas: RequiredCodec(U128),
  maxFeePerGas: OptionalCodec(U128),
  maxPriorityFeePerGas: OptionalCodec(U128),
  input: RequiredCodec(BytesFromUint8Array),
  signature: OptionalCodec(Signature),
  chainId: OptionalCodec(BigIntCodec),
  accessList: ArrayCodec(AccessListItem),
  transactionType: RequiredCodec(BigIntCodec),
  maxFeePerBlobGas: OptionalCodec(U128),
  blobVersionedHashes: ArrayCodec(B256),
  transactionStatus: RequiredCodec(TransactionStatus),
});

export type Transaction = CodecType<typeof Transaction>;

export const TransactionReceipt = MessageCodec({
  filterIds: ArrayCodec(NumberCodec),
  transactionIndex: RequiredCodec(NumberCodec),
  transactionHash: RequiredCodec(B256),
  cumulativeGasUsed: RequiredCodec(U128),
  gasUsed: RequiredCodec(U128),
  effectiveGasPrice: RequiredCodec(U128),
  from: RequiredCodec(Address),
  to: OptionalCodec(Address),
  contractAddress: OptionalCodec(Address),
  logsBloom: RequiredCodec(Bloom),
  transactionType: RequiredCodec(BigIntCodec),
  blobGasUsed: OptionalCodec(U128),
  blobGasPrice: OptionalCodec(U128),
  transactionStatus: RequiredCodec(TransactionStatus),
});

export type TransactionReceipt = CodecType<typeof TransactionReceipt>;

export const Log = MessageCodec({
  filterIds: ArrayCodec(NumberCodec),
  address: RequiredCodec(Address),
  topics: ArrayCodec(B256),
  data: RequiredCodec(BytesFromUint8Array),
  logIndex: RequiredCodec(NumberCodec),
  logIndexInTransaction: RequiredCodec(NumberCodec),
  transactionIndex: RequiredCodec(NumberCodec),
  transactionHash: RequiredCodec(B256),
  transactionStatus: RequiredCodec(TransactionStatus),
});

export type Log = CodecType<typeof Log>;

export const CallType: Codec<
  "unknown" | "call" | "delegateCall" | "callCode" | "staticCall" | "authCall",
  proto.data.CallType
> = {
  encode(x) {
    const enumMap = {
      unknown: proto.data.CallType.UNSPECIFIED,
      call: proto.data.CallType.CALL,
      callCode: proto.data.CallType.CALL_CODE,
      delegateCall: proto.data.CallType.DELEGATE_CALL,
      staticCall: proto.data.CallType.STATIC_CALL,
      authCall: proto.data.CallType.AUTH_CALL,
    } as const;

    return enumMap[x] ?? proto.data.CallType.UNSPECIFIED;
  },
  decode(p) {
    const enumMap = {
      [proto.data.CallType.CALL]: "call",
      [proto.data.CallType.CALL_CODE]: "callCode",
      [proto.data.CallType.DELEGATE_CALL]: "delegateCall",
      [proto.data.CallType.STATIC_CALL]: "staticCall",
      [proto.data.CallType.AUTH_CALL]: "authCall",
      [proto.data.CallType.UNSPECIFIED]: "unknown",
      [proto.data.CallType.UNRECOGNIZED]: "unknown",
    } as const;

    return enumMap[p] ?? "unknown";
  },
};

export type CallType = CodecType<typeof CallType>;

export const CreationMethod: Codec<
  "unknown" | "create" | "create2" | "eofCreate",
  proto.data.CreationMethod
> = {
  encode(x) {
    const enumMap = {
      unknown: proto.data.CreationMethod.UNSPECIFIED,
      create: proto.data.CreationMethod.CREATE,
      create2: proto.data.CreationMethod.CREATE2,
      eofCreate: proto.data.CreationMethod.EOF_CREATE,
    } as const;

    return enumMap[x] ?? proto.data.CreationMethod.UNSPECIFIED;
  },
  decode(p) {
    const enumMap = {
      [proto.data.CreationMethod.CREATE]: "create",
      [proto.data.CreationMethod.CREATE2]: "create2",
      [proto.data.CreationMethod.EOF_CREATE]: "eofCreate",
      [proto.data.CreationMethod.UNSPECIFIED]: "unknown",
      [proto.data.CreationMethod.UNRECOGNIZED]: "unknown",
    } as const;

    return enumMap[p] ?? "unknown";
  },
};

export type CreationMethod = CodecType<typeof CreationMethod>;

export const CallAction = MessageCodec({
  fromAddress: RequiredCodec(Address),
  type: RequiredCodec(CallType),
  gas: RequiredCodec(BigIntCodec),
  input: RequiredCodec(BytesFromUint8Array),
  toAddress: RequiredCodec(Address),
  value: RequiredCodec(U256),
});

export type CallAction = CodecType<typeof CallAction>;

export const CreateAction = MessageCodec({
  fromAddress: RequiredCodec(Address),
  gas: RequiredCodec(BigIntCodec),
  init: RequiredCodec(BytesFromUint8Array),
  value: RequiredCodec(U256),
  creationMethod: RequiredCodec(CreationMethod),
});

export type CreateAction = CodecType<typeof CreateAction>;

export const SelfDestructAction = MessageCodec({
  address: RequiredCodec(Address),
  balance: RequiredCodec(U256),
  refundAddress: RequiredCodec(Address),
});

export type SelfDestructAction = CodecType<typeof SelfDestructAction>;

export const RewardType: Codec<
  "unknown" | "block" | "uncle",
  proto.data.RewardType
> = {
  encode(x) {
    const enumMap = {
      unknown: proto.data.RewardType.UNSPECIFIED,
      block: proto.data.RewardType.BLOCK,
      uncle: proto.data.RewardType.UNCLE,
    } as const;

    return enumMap[x] ?? proto.data.RewardType.UNSPECIFIED;
  },
  decode(p) {
    const enumMap = {
      [proto.data.RewardType.BLOCK]: "block",
      [proto.data.RewardType.UNCLE]: "uncle",
      [proto.data.RewardType.UNSPECIFIED]: "unknown",
      [proto.data.RewardType.UNRECOGNIZED]: "unknown",
    } as const;

    return enumMap[p] ?? "unknown";
  },
};

export type RewardType = CodecType<typeof RewardType>;

export const RewardAction = MessageCodec({
  author: RequiredCodec(Address),
  type: RequiredCodec(RewardType),
  value: RequiredCodec(U256),
});

export type RewardAction = CodecType<typeof RewardAction>;

export const CallOutput = MessageCodec({
  gasUsed: RequiredCodec(BigIntCodec),
  output: RequiredCodec(BytesFromUint8Array),
});

export type CallOutput = CodecType<typeof CallOutput>;

export const CreateOutput = MessageCodec({
  address: RequiredCodec(Address),
  code: RequiredCodec(BytesFromUint8Array),
  gasUsed: RequiredCodec(BigIntCodec),
});

export type CreateOutput = CodecType<typeof CreateOutput>;

export const Trace = MessageCodec({
  action: RequiredCodec(
    OneOfCodec({
      call: CallAction,
      create: CreateAction,
      selfDestruct: SelfDestructAction,
      reward: RewardAction,
    }),
  ),
  error: OptionalCodec(StringCodec),
  output: OptionalCodec(
    OneOfCodec({
      callOutput: CallOutput,
      createOutput: CreateOutput,
    }),
  ),
  subtraces: RequiredCodec(NumberCodec),
  traceAddress: ArrayCodec(NumberCodec),
});

export type Trace = CodecType<typeof Trace>;

export const TransactionTrace = MessageCodec({
  filterIds: ArrayCodec(NumberCodec),
  transactionIndex: RequiredCodec(NumberCodec),
  transactionHash: RequiredCodec(B256),
  traces: ArrayCodec(Trace),
});

export type TransactionTrace = CodecType<typeof TransactionTrace>;

export const Block = MessageCodec({
  header: RequiredCodec(BlockHeader),
  withdrawals: ArrayCodec(Withdrawal),
  transactions: ArrayCodec(Transaction),
  receipts: ArrayCodec(TransactionReceipt),
  logs: ArrayCodec(Log),
  traces: ArrayCodec(TransactionTrace),
});

export type Block = CodecType<typeof Block>;

export const BlockFromBytes: Codec<Block, Uint8Array> = {
  encode(x) {
    const block = Block.encode(x);
    return proto.data.Block.encode(block).finish();
  },
  decode(p) {
    const block = proto.data.Block.decode(p);
    return Block.decode(block);
  },
};
