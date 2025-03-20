import { AccessListItem } from "@apibara/evm";
import { BytesFromUint8Array } from "@apibara/protocol";
import { Schema } from "@effect/schema";

import { Address, B256, B384, U128, U256, ValidatorStatus } from "./common";
import * as proto from "./proto";

export const ExecutionPayload = Schema.Struct({
  parentHash: B256,
  feeRecipient: Address,
  stateRoot: B256,
  receiptsRoot: B256,
  logsBloom: BytesFromUint8Array,
  prevRandao: B256,
  blockNumber: Schema.BigIntFromSelf,
  timestamp: Schema.DateFromSelf,
});

export type ExecutionPayload = typeof ExecutionPayload.Type;

export const BlockHeader = Schema.Struct({
  slot: Schema.BigIntFromSelf,
  proposerIndex: Schema.Number,
  parentRoot: B256,
  stateRoot: B256,
  randaoReveal: BytesFromUint8Array,
  depositCount: Schema.BigIntFromSelf,
  depositRoot: B256,
  blockHash: B256,
  graffiti: B256,
  executionPayload: Schema.optional(ExecutionPayload),
  blobKzgCommitments: Schema.Array(B384),
});

export type BlockHeader = typeof BlockHeader.Type;

export const Validator = Schema.Struct({
  filterIds: Schema.Array(Schema.Number),
  validatorIndex: Schema.Number,
  balance: Schema.BigIntFromSelf,
  status: ValidatorStatus,
  pubkey: B384,
  withdrawalCredentials: B256,
  effectiveBalance: Schema.BigIntFromSelf,
  slashed: Schema.Boolean,
  activationEligibilityEpoch: Schema.BigIntFromSelf,
  activationEpoch: Schema.BigIntFromSelf,
  exitEpoch: Schema.BigIntFromSelf,
  withdrawableEpoch: Schema.BigIntFromSelf,
});

export type Validator = typeof Validator.Type;

export const Blob = Schema.Struct({
  filterIds: Schema.Array(Schema.Number),
  blobIndex: Schema.Number,
  blob: Schema.Uint8ArrayFromSelf,
  kzgCommitment: B384,
  kzgProof: B384,
  kzgCommitmentInclusionProof: Schema.Array(B256),
  blobHash: B256,
  transactionIndex: Schema.Number,
  transactionHash: B256,
});

export type Blob = typeof Blob.Type;

export const Signature = Schema.Struct({
  r: Schema.optional(U256),
  s: Schema.optional(U256),
  v: Schema.optional(U256),
  YParity: Schema.optional(Schema.Boolean),
});

export type Signature = typeof Signature.Type;

export const Transaction = Schema.Struct({
  filterIds: Schema.Array(Schema.Number),
  transactionHash: B256,
  nonce: Schema.BigIntFromSelf,
  transactionIndex: Schema.Number,
  from: Address,
  to: Schema.optional(Address),
  value: U256,
  gasPrice: Schema.optional(U128),
  gasLimit: Schema.optional(U128),
  maxFeePerGas: Schema.optional(U128),
  maxPriorityFeePerGas: Schema.optional(U128),
  input: Schema.Uint8ArrayFromSelf,
  signature: Schema.optional(Signature),
  chainId: Schema.optional(Schema.BigIntFromSelf),
  accessList: Schema.Array(AccessListItem),
  transactionType: Schema.BigIntFromSelf,
  maxFeePerBlobGas: Schema.optional(U128),
  blobVersionedHashes: Schema.Array(B256),
});

export type Transaction = typeof Transaction.Type;

export const Block = Schema.Struct({
  header: BlockHeader,
  validators: Schema.Array(Validator),
  blobs: Schema.Array(Blob),
  transactions: Schema.Array(Transaction),
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
