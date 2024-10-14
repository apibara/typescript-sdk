import { Schema } from "@effect/schema";

import { FieldElement } from "./common";
import { tag } from "./helpers";
import * as proto from "./proto";

/** Price of a unit of resource.
 *
 * @prop priceInFri The price in Fri (1e-18 STRK).
 * @prop priceInWei The price in Wei (1e-18 ETH).
 */
export const ResourcePrice = Schema.Struct({
  priceInFri: Schema.optional(FieldElement),
  priceInWei: Schema.optional(FieldElement),
});

/** How data is posted to L1. */
export const L1DataAvailabilityMode = Schema.transform(
  Schema.Enums(proto.data.L1DataAvailabilityMode),
  Schema.Literal("blob", "calldata", "unknown"),
  {
    decode(value) {
      const enumMap = {
        [proto.data.L1DataAvailabilityMode.CALLDATA]: "calldata",
        [proto.data.L1DataAvailabilityMode.BLOB]: "blob",
        [proto.data.L1DataAvailabilityMode.UNSPECIFIED]: "unknown",
        [proto.data.L1DataAvailabilityMode.UNRECOGNIZED]: "unknown",
      } as const;

      return enumMap[value] ?? "unknown";
    },
    encode(value) {
      throw new Error("encode: not implemented");
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

export const U128 = Schema.transform(
  Schema.Struct({
    x0: Schema.BigIntFromSelf,
    x1: Schema.BigIntFromSelf,
  }),
  Schema.BigIntFromSelf,
  {
    decode(value) {
      const low = value.x0.toString(16).padStart(16, "0");
      const high = value.x1.toString(16).padStart(16, "0");
      return BigInt(`0x${low}${high}`);
    },
    encode(value) {
      throw new Error("encode: not implemented");
    },
  },
);

export const ResourceBounds = Schema.Struct({
  maxAmount: Schema.optional(Schema.BigIntFromSelf),
  maxPricePerUnit: Schema.optional(U128),
});

export const ResourceBoundsMapping = Schema.Struct({
  l1Gas: Schema.optional(ResourceBounds),
  l2Gas: Schema.optional(ResourceBounds),
});

export const DataAvailabilityMode = Schema.transform(
  Schema.Enums(proto.data.DataAvailabilityMode),
  Schema.Literal("l1", "l2", "unknown"),
  {
    decode(value) {
      const enumMap = {
        [proto.data.DataAvailabilityMode.L1]: "l1",
        [proto.data.DataAvailabilityMode.L2]: "l2",
        [proto.data.DataAvailabilityMode.UNSPECIFIED]: "unknown",
        [proto.data.DataAvailabilityMode.UNRECOGNIZED]: "unknown",
      } as const;

      return enumMap[value] ?? "unknown";
    },
    encode(value) {
      throw new Error("encode: not implemented");
    },
  },
);

/** Starknet block header.
 *
 * @prop blockHash The hash of the block.
 * @prop parentBlockHash The hash of the parent block.
 * @prop blockNumber The block number.
 * @prop sequencerAddress The address of the sequencer.
 * @prop newRoot The new state root.
 * @prop timestamp The block timestamp.
 * @prop starknetVersion The Starknet version string.
 * @prop l1GasPrice Calldata gas price.
 * @prop l1DataGasPrice Blob gas price.
 * @prop l1DataAvailabilityMode How data is posted to L1.
 */
export const BlockHeader = Schema.Struct({
  blockHash: Schema.optional(FieldElement),
  parentBlockHash: Schema.optional(FieldElement),
  blockNumber: Schema.BigIntFromSelf,
  sequencerAddress: Schema.optional(FieldElement),
  newRoot: Schema.optional(FieldElement),
  timestamp: Schema.optional(Schema.DateFromSelf),
  starknetVersion: Schema.optional(Schema.String),
  l1GasPrice: Schema.optional(ResourcePrice),
  l1DataGasPrice: Schema.optional(ResourcePrice),
  l1DataAvailabilityMode: Schema.optional(L1DataAvailabilityMode),
});

export type BlockHeader = typeof BlockHeader.Type;

/** Transaction metadata.
 *
 * This is the information that is common between all transaction types.
 *
 * @prop transactionIndex The transaction index in the block.
 * @prop transactionHash The transaction hash.
 * @prop transactionStatus The transaction status.
 */
export const TransactionMeta = Schema.Struct({
  transactionIndex: Schema.optional(Schema.Number),
  transactionHash: Schema.optional(FieldElement),
  transactionStatus: Schema.optional(TransactionStatus),
});

export type TransactionMeta = typeof TransactionMeta.Type;

export const InvokeTransactionV0 = Schema.Struct({
  _tag: tag("invokeV0"),
  invokeV0: Schema.Struct({
    maxFee: Schema.optional(FieldElement),
    signature: Schema.optional(Schema.Array(FieldElement)),
    contractAddress: Schema.optional(FieldElement),
    entryPointSelector: Schema.optional(FieldElement),
    calldata: Schema.optional(Schema.Array(FieldElement)),
  }),
});

export const InvokeTransactionV1 = Schema.Struct({
  _tag: tag("invokeV1"),
  invokeV1: Schema.Struct({
    senderAddress: Schema.optional(FieldElement),
    calldata: Schema.optional(Schema.Array(FieldElement)),
    maxFee: Schema.optional(FieldElement),
    signature: Schema.optional(Schema.Array(FieldElement)),
    nonce: Schema.optional(FieldElement),
  }),
});

export const InvokeTransactionV3 = Schema.Struct({
  _tag: tag("invokeV3"),
  invokeV3: Schema.Struct({
    senderAddress: Schema.optional(FieldElement),
    calldata: Schema.optional(Schema.Array(FieldElement)),
    signature: Schema.optional(Schema.Array(FieldElement)),
    nonce: Schema.optional(FieldElement),
    resourceBounds: Schema.optional(ResourceBoundsMapping),
    tip: Schema.optional(Schema.BigIntFromSelf),
    paymasterData: Schema.optional(Schema.Array(FieldElement)),
    accountDeploymentData: Schema.optional(Schema.Array(FieldElement)),
    nonceDataAvailabilityMode: Schema.optional(DataAvailabilityMode),
    feeDataAvailabilityMode: Schema.optional(DataAvailabilityMode),
  }),
});

export const L1HandlerTransaction = Schema.Struct({
  _tag: tag("l1Handler"),
  l1Handler: Schema.Struct({
    nonce: Schema.optional(Schema.BigIntFromSelf),
    contractAddress: Schema.optional(FieldElement),
    entryPointSelector: Schema.optional(FieldElement),
    calldata: Schema.optional(Schema.Array(FieldElement)),
  }),
});

export const DeployTransaction = Schema.Struct({
  _tag: tag("deploy"),
  deploy: Schema.Struct({
    contractAddressSalt: Schema.optional(FieldElement),
    constructorCalldata: Schema.optional(Schema.Array(FieldElement)),
    classHash: Schema.optional(FieldElement),
  }),
});

export const DeclareTransactionV0 = Schema.Struct({
  _tag: tag("declareV0"),
  declareV0: Schema.Struct({
    senderAddress: Schema.optional(FieldElement),
    maxFee: Schema.optional(FieldElement),
    signature: Schema.optional(Schema.Array(FieldElement)),
    classHash: Schema.optional(FieldElement),
  }),
});

export const DeclareTransactionV1 = Schema.Struct({
  _tag: tag("declareV1"),
  declareV1: Schema.Struct({
    senderAddress: Schema.optional(FieldElement),
    maxFee: Schema.optional(FieldElement),
    signature: Schema.optional(Schema.Array(FieldElement)),
    nonce: Schema.optional(FieldElement),
    classHash: Schema.optional(FieldElement),
  }),
});

export const DeclareTransactionV2 = Schema.Struct({
  _tag: tag("declareV2"),
  declareV2: Schema.Struct({
    senderAddress: Schema.optional(FieldElement),
    compiledClassHash: Schema.optional(FieldElement),
    maxFee: Schema.optional(FieldElement),
    signature: Schema.optional(Schema.Array(FieldElement)),
    nonce: Schema.optional(FieldElement),
    classHash: Schema.optional(FieldElement),
  }),
});

export const DeclareTransactionV3 = Schema.Struct({
  _tag: tag("declareV3"),
  declareV3: Schema.Struct({
    senderAddress: Schema.optional(FieldElement),
    compiledClassHash: Schema.optional(FieldElement),
    signature: Schema.optional(Schema.Array(FieldElement)),
    nonce: Schema.optional(FieldElement),
    classHash: Schema.optional(FieldElement),
    resourceBounds: Schema.optional(ResourceBoundsMapping),
    tip: Schema.optional(Schema.BigIntFromSelf),
    paymasterData: Schema.optional(Schema.Array(FieldElement)),
    accountDeploymentData: Schema.optional(Schema.Array(FieldElement)),
    nonceDataAvailabilityMode: Schema.optional(DataAvailabilityMode),
    feeDataAvailabilityMode: Schema.optional(DataAvailabilityMode),
  }),
});

export const DeployAccountTransactionV1 = Schema.Struct({
  _tag: tag("deployAccountV1"),
  deployAccountV1: Schema.Struct({
    maxFee: Schema.optional(FieldElement),
    signature: Schema.optional(Schema.Array(FieldElement)),
    nonce: Schema.optional(FieldElement),
    contractAddressSalt: Schema.optional(FieldElement),
    constructorCalldata: Schema.optional(Schema.Array(FieldElement)),
    classHash: Schema.optional(FieldElement),
  }),
});

export const DeployAccountTransactionV3 = Schema.Struct({
  _tag: tag("deployAccountV3"),
  deployAccountV3: Schema.Struct({
    signature: Schema.optional(Schema.Array(FieldElement)),
    nonce: Schema.optional(FieldElement),
    contractAddressSalt: Schema.optional(FieldElement),
    constructorCalldata: Schema.optional(Schema.Array(FieldElement)),
    classHash: Schema.optional(FieldElement),
    resourceBounds: Schema.optional(ResourceBoundsMapping),
    tip: Schema.optional(Schema.BigIntFromSelf),
    paymasterData: Schema.optional(Schema.Array(FieldElement)),
    nonceDataAvailabilityMode: Schema.optional(DataAvailabilityMode),
    feeDataAvailabilityMode: Schema.optional(DataAvailabilityMode),
  }),
});

/** A transaction.
 *
 * @prop meta Transaction metadata.
 */
export const Transaction = Schema.Struct({
  filterIds: Schema.optional(Schema.Array(Schema.Number)),
  meta: Schema.optional(TransactionMeta),
  transaction: Schema.optional(
    Schema.Union(
      InvokeTransactionV0,
      InvokeTransactionV1,
      InvokeTransactionV3,
      L1HandlerTransaction,
      DeployTransaction,
      DeclareTransactionV0,
      DeclareTransactionV1,
      DeclareTransactionV2,
      DeclareTransactionV3,
      DeployAccountTransactionV1,
      DeployAccountTransactionV3,
    ),
  ),
});

export type Transaction = typeof Transaction.Type;

export const PriceUnit = Schema.transform(
  Schema.Enums(proto.data.PriceUnit),
  Schema.Literal("wei", "fri", "unknown"),
  {
    decode(value) {
      const enumMap = {
        [proto.data.PriceUnit.WEI]: "wei",
        [proto.data.PriceUnit.FRI]: "fri",
        [proto.data.PriceUnit.UNSPECIFIED]: "unknown",
        [proto.data.PriceUnit.UNRECOGNIZED]: "unknown",
      } as const;

      return enumMap[value] ?? "unknown";
    },
    encode(value) {
      throw new Error("encode: not implemented");
    },
  },
);

export const FeePayment = Schema.Struct({
  amount: Schema.optional(FieldElement),
  unit: Schema.optional(PriceUnit),
});

export const ComputationResources = Schema.Struct({
  steps: Schema.optional(Schema.BigIntFromSelf),
  memoryHoles: Schema.optional(Schema.BigIntFromSelf),
  rangeCheckBuiltinApplications: Schema.optional(Schema.BigIntFromSelf),
  pedersenBuiltinApplications: Schema.optional(Schema.BigIntFromSelf),
  poseidonBuiltinApplications: Schema.optional(Schema.BigIntFromSelf),
  ecOpBuiltinApplications: Schema.optional(Schema.BigIntFromSelf),
  ecdsaBuiltinApplications: Schema.optional(Schema.BigIntFromSelf),
  bitwiseBuiltinApplications: Schema.optional(Schema.BigIntFromSelf),
  keccakBuiltinApplications: Schema.optional(Schema.BigIntFromSelf),
  segmentArenaBuiltin: Schema.optional(Schema.BigIntFromSelf),
});

export const DataAvailabilityResources = Schema.Struct({
  l1Gas: Schema.optional(Schema.BigIntFromSelf),
  l1DataGas: Schema.optional(Schema.BigIntFromSelf),
});

export const ExecutionResources = Schema.Struct({
  computation: Schema.optional(ComputationResources),
  dataAvailability: Schema.optional(DataAvailabilityResources),
});

export const ExecutionSucceeded = Schema.Struct({
  _tag: tag("succeeded"),
  succeeded: Schema.Struct({}),
});

export const ExecutionReverted = Schema.Struct({
  _tag: tag("reverted"),
  reverted: Schema.Struct({
    reason: Schema.optional(Schema.String),
  }),
});

/** Common fields for all transaction receipts. */
export const TransactionReceiptMeta = Schema.Struct({
  transactionIndex: Schema.optional(Schema.Number),
  transactionHash: Schema.optional(FieldElement),
  actualFee: Schema.optional(FeePayment),
  executionResources: Schema.optional(ExecutionResources),
  executionResult: Schema.optional(
    Schema.Union(ExecutionSucceeded, ExecutionReverted),
  ),
});

export const InvokeTransactionReceipt = Schema.Struct({
  _tag: tag("invoke"),
  invoke: Schema.Struct({}),
});

export const L1HandlerTransactionReceipt = Schema.Struct({
  _tag: tag("l1Handler"),
  l1Handler: Schema.Struct({
    messageHash: Schema.optional(Schema.Uint8ArrayFromSelf),
  }),
});

export const DeclareTransactionReceipt = Schema.Struct({
  _tag: tag("declare"),
  declare: Schema.Struct({}),
});

export const DeployTransactionReceipt = Schema.Struct({
  _tag: tag("deploy"),
  deploy: Schema.Struct({
    contractAddress: Schema.optional(FieldElement),
  }),
});

export const DeployAccountTransactionReceipt = Schema.Struct({
  _tag: tag("deployAccount"),
  deployAccount: Schema.Struct({
    contractAddress: Schema.optional(FieldElement),
  }),
});

/** A transaction receipt.
 *
 * @prop meta Transaction receipt metadata.
 * @prop receipt Transaction-specific receipt.
 */
export const TransactionReceipt = Schema.Struct({
  filterIds: Schema.optional(Schema.Array(Schema.Number)),
  meta: Schema.optional(TransactionReceiptMeta),
  receipt: Schema.optional(
    Schema.Union(
      InvokeTransactionReceipt,
      L1HandlerTransactionReceipt,
      DeclareTransactionReceipt,
      DeployTransactionReceipt,
      DeployAccountTransactionReceipt,
    ),
  ),
});

export type TransactionReceipt = typeof TransactionReceipt.Type;

/** A transaction event.
 *
 * @prop fromAddress The address that emitted the event.
 * @prop keys Indexed fields of the event.
 * @prop data Non-indexed fields of the event.
 * @prop eventIndex The event index in the block.
 * @prop transactionIndex The transaction index in the block.
 * @prop transactionHash The transaction hash.
 * @prop transactionStatus The transaction status.
 */
export const Event = Schema.Struct({
  filterIds: Schema.optional(Schema.Array(Schema.Number)),
  address: Schema.optional(FieldElement),
  keys: Schema.optional(Schema.Array(FieldElement)),
  data: Schema.optional(Schema.Array(FieldElement)),
  eventIndex: Schema.optional(Schema.Number),
  transactionIndex: Schema.optional(Schema.Number),
  transactionHash: Schema.optional(FieldElement),
  transactionStatus: Schema.optional(TransactionStatus),
});

export type Event = typeof Event.Type;

/** A message from the L2 to the L1.
 *
 * @prop fromAddress The address on L2 that sent the message.
 * @prop toAddress The address on L1 that will receive the message.
 * @prop payload The message payload.
 * @prop messageIndex The message index in the block.
 * @prop transactionIndex The transaction index in the block.
 * @prop transactionHash The transaction hash.
 * @prop transactionStatus The transaction status.
 */
export const MessageToL1 = Schema.Struct({
  filterIds: Schema.optional(Schema.Array(Schema.Number)),
  fromAddress: Schema.optional(FieldElement),
  toAddress: Schema.optional(FieldElement),
  payload: Schema.optional(Schema.Array(FieldElement)),
  messageIndex: Schema.optional(Schema.Number),
  transactionIndex: Schema.optional(Schema.Number),
  transactionHash: Schema.optional(FieldElement),
  transactionStatus: Schema.optional(TransactionStatus),
});

export type MessageToL1 = typeof MessageToL1.Type;

/** A block.
 *
 * @prop header The block header.
 * @prop transactions The transactions in the block.
 * @prop receipts The receipts of the transactions.
 * @prop events The events emitted by the transactions.
 * @prop messages The messages sent to L1 by the transactions.
 */
export const Block = Schema.Struct({
  header: Schema.optional(BlockHeader),
  transactions: Schema.Array(Transaction),
  receipts: Schema.Array(TransactionReceipt),
  events: Schema.Array(Event),
  messages: Schema.Array(MessageToL1),
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
