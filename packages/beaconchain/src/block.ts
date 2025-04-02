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
  OptionalCodec,
  RequiredCodec,
} from "@apibara/protocol/codec";
import { Address, B256, B384, U128, U256, ValidatorStatus } from "./common";
import * as proto from "./proto";

export const ExecutionPayload = MessageCodec({
  parentHash: RequiredCodec(B256),
  feeRecipient: RequiredCodec(Address),
  stateRoot: RequiredCodec(B256),
  receiptsRoot: RequiredCodec(B256),
  logsBloom: RequiredCodec(BytesFromUint8Array),
  prevRandao: RequiredCodec(B256),
  blockNumber: RequiredCodec(BigIntCodec),
  timestamp: RequiredCodec(DateCodec),
});

export type ExecutionPayload = CodecType<typeof ExecutionPayload>;

export const BlockHeader = MessageCodec({
  slot: RequiredCodec(BigIntCodec),
  proposerIndex: RequiredCodec(NumberCodec),
  parentRoot: RequiredCodec(B256),
  stateRoot: RequiredCodec(B256),
  randaoReveal: RequiredCodec(BytesFromUint8Array),
  depositCount: RequiredCodec(BigIntCodec),
  depositRoot: RequiredCodec(B256),
  blockHash: RequiredCodec(B256),
  graffiti: RequiredCodec(B256),
  executionPayload: OptionalCodec(ExecutionPayload),
  blobKzgCommitments: ArrayCodec(B384),
});

export type BlockHeader = CodecType<typeof BlockHeader>;

export const Validator = MessageCodec({
  filterIds: ArrayCodec(NumberCodec),
  validatorIndex: RequiredCodec(NumberCodec),
  balance: RequiredCodec(BigIntCodec),
  status: RequiredCodec(ValidatorStatus),
  pubkey: RequiredCodec(B384),
  withdrawalCredentials: RequiredCodec(B256),
  effectiveBalance: RequiredCodec(BigIntCodec),
  slashed: RequiredCodec(BooleanCodec),
  activationEligibilityEpoch: RequiredCodec(BigIntCodec),
  activationEpoch: RequiredCodec(BigIntCodec),
  exitEpoch: RequiredCodec(BigIntCodec),
  withdrawableEpoch: RequiredCodec(BigIntCodec),
});

export type Validator = CodecType<typeof Validator>;

export const Blob = MessageCodec({
  filterIds: ArrayCodec(NumberCodec),
  blobIndex: RequiredCodec(NumberCodec),
  blob: RequiredCodec(BytesFromUint8Array),
  kzgCommitment: RequiredCodec(B384),
  kzgProof: RequiredCodec(B384),
  kzgCommitmentInclusionProof: ArrayCodec(B256),
  blobHash: RequiredCodec(B256),
  transactionIndex: RequiredCodec(NumberCodec),
  transactionHash: RequiredCodec(B256),
});

export type Blob = CodecType<typeof Blob>;

export const Signature = MessageCodec({
  r: OptionalCodec(U256),
  s: OptionalCodec(U256),
  v: OptionalCodec(U256),
  YParity: OptionalCodec(BooleanCodec),
});

export type Signature = CodecType<typeof Signature>;

export const AccessListItem = MessageCodec({
  address: RequiredCodec(Address),
  storageKeys: ArrayCodec(B256),
});

export type AccessListItem = CodecType<typeof AccessListItem>;

export const Transaction = MessageCodec({
  filterIds: ArrayCodec(NumberCodec),
  transactionHash: RequiredCodec(B256),
  nonce: RequiredCodec(BigIntCodec),
  transactionIndex: RequiredCodec(NumberCodec),
  from: RequiredCodec(Address),
  to: OptionalCodec(Address),
  value: RequiredCodec(U256),
  gasPrice: OptionalCodec(U128),
  gasLimit: OptionalCodec(U128),
  maxFeePerGas: OptionalCodec(U128),
  maxPriorityFeePerGas: OptionalCodec(U128),
  input: RequiredCodec(BytesFromUint8Array),
  signature: OptionalCodec(Signature),
  chainId: OptionalCodec(BigIntCodec),
  accessList: ArrayCodec(AccessListItem),
  transactionType: RequiredCodec(BigIntCodec),
  maxFeePerBlobGas: OptionalCodec(U128),
  blobVersionedHashes: ArrayCodec(B256),
});

export type Transaction = CodecType<typeof Transaction>;

export const Block = MessageCodec({
  header: RequiredCodec(BlockHeader),
  validators: ArrayCodec(Validator),
  blobs: ArrayCodec(Blob),
  transactions: ArrayCodec(Transaction),
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
