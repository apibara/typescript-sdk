import { AccessListItem, Signature } from "@apibara/evm";
import { BytesFromUint8Array } from "@apibara/protocol";
import { Schema } from "@effect/schema";

import { Address, B256, B384, U128, U256, ValidatorStatus } from "./common";
import * as proto from "./proto";

export const ExecutionPayload = Schema.Struct({
  parentHash: Schema.optional(B256),
  feeRecipient: Schema.optional(Address),
  stateRoot: Schema.optional(B256),
  receiptsRoot: Schema.optional(B256),
  logsBloom: BytesFromUint8Array,
  prevRandao: Schema.optional(B256),
  blockNumber: Schema.optional(Schema.BigIntFromSelf),
  timestamp: Schema.optional(Schema.DateFromSelf),
});

export type ExecutionPayload = typeof ExecutionPayload.Type;

export const BlockHeader = Schema.Struct({
  slot: Schema.BigIntFromSelf,
  proposerIndex: Schema.Number,
  parentRoot: Schema.optional(B256),
  stateRoot: Schema.optional(B256),
  randaoReveal: BytesFromUint8Array,
  depositCount: Schema.optional(Schema.BigIntFromSelf),
  depositRoot: Schema.optional(B256),
  blockHash: Schema.optional(B256),
  graffiti: Schema.optional(B256),
  executionPayload: Schema.optional(ExecutionPayload),
  blobKzgCommitments: Schema.optional(Schema.Array(B384)),
});

export type BlockHeader = typeof BlockHeader.Type;

export const Validator = Schema.Struct({
  validatorIndex: Schema.optional(Schema.Number),
  balance: Schema.optional(Schema.BigIntFromSelf),
  status: Schema.optional(ValidatorStatus),
  pubkey: Schema.optional(B384),
  withdrawalCredentials: Schema.optional(B256),
  effectiveBalance: Schema.optional(Schema.BigIntFromSelf),
  slashed: Schema.optional(Schema.Boolean),
  activationEligibilityEpoch: Schema.optional(Schema.BigIntFromSelf),
  activationEpoch: Schema.optional(Schema.BigIntFromSelf),
  exitEpoch: Schema.optional(Schema.BigIntFromSelf),
  withdrawableEpoch: Schema.optional(Schema.BigIntFromSelf),
});

export const Blob = Schema.Struct({
  blobIndex: Schema.optional(Schema.Number),
  blob: Schema.optional(Schema.Uint8ArrayFromSelf),
  kzgCommitment: Schema.optional(B384),
  kzgProof: Schema.optional(B384),
  kzgCommitmentInclusionProof: Schema.optional(Schema.Array(B256)),
  blobHash: Schema.optional(B256),
  transactionIndex: Schema.optional(Schema.Number),
  transactionHash: Schema.optional(B256),
});

export const Transaction = Schema.Struct({
  transactionHash: Schema.optional(B256),
  nonce: Schema.optional(Schema.BigIntFromSelf),
  transactionIndex: Schema.optional(Schema.Number),
  from: Schema.optional(Address),
  to: Schema.optional(Address),
  value: Schema.optional(U256),
  gasPrice: Schema.optional(U128),
  gasLimit: Schema.optional(U128),
  maxFeePerGas: Schema.optional(U128),
  maxPriorityFeePerGas: Schema.optional(U128),
  input: Schema.optional(Schema.Uint8ArrayFromSelf),
  signature: Schema.optional(Signature),
  chainId: Schema.optional(Schema.BigIntFromSelf),
  accessList: Schema.optional(Schema.Array(AccessListItem)),
  transactionType: Schema.optional(Schema.BigIntFromSelf),
  maxFeePerBlobGas: Schema.optional(U128),
  blobVersionedHashes: Schema.optional(Schema.Array(B256)),
});

export type Transaction = typeof Transaction.Type;

export const Block = Schema.Struct({
  header: Schema.optional(BlockHeader),
  validators: Schema.Array(Validator),
  blobs: Schema.Array(Blob),
  transactions: Schema.Array(Transaction),
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
