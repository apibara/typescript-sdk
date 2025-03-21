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

export type ResourcePrice = typeof ResourcePrice.Type;

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

export type L1DataAvailabilityMode = typeof L1DataAvailabilityMode.Type;

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

export type U128 = typeof U128.Type;

export const ResourceBounds = Schema.Struct({
  maxAmount: Schema.BigIntFromSelf,
  maxPricePerUnit: U128,
});

export type ResourceBounds = typeof ResourceBounds.Type;

export const ResourceBoundsMapping = Schema.Struct({
  l1Gas: ResourceBounds,
  l2Gas: ResourceBounds,
});

export type ResourceBoundsMapping = typeof ResourceBoundsMapping.Type;

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

export type DataAvailabilityMode = typeof DataAvailabilityMode.Type;

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
  parentBlockHash: FieldElement,
  blockNumber: Schema.BigIntFromSelf,
  sequencerAddress: FieldElement,
  newRoot: Schema.optional(FieldElement),
  timestamp: Schema.DateFromSelf,
  starknetVersion: Schema.String,
  l1GasPrice: ResourcePrice,
  l1DataGasPrice: ResourcePrice,
  l1DataAvailabilityMode: L1DataAvailabilityMode,
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
  transactionIndex: Schema.Number,
  transactionHash: FieldElement,
  transactionStatus: TransactionStatus,
});

export type TransactionMeta = typeof TransactionMeta.Type;

export const InvokeTransactionV0 = Schema.Struct({
  _tag: tag("invokeV0"),
  invokeV0: Schema.Struct({
    maxFee: FieldElement,
    signature: Schema.Array(FieldElement),
    contractAddress: FieldElement,
    entryPointSelector: FieldElement,
    calldata: Schema.Array(FieldElement),
  }),
});

export type InvokeTransactionV0 = typeof InvokeTransactionV0.Type;

export const InvokeTransactionV1 = Schema.Struct({
  _tag: tag("invokeV1"),
  invokeV1: Schema.Struct({
    senderAddress: FieldElement,
    calldata: Schema.Array(FieldElement),
    maxFee: FieldElement,
    signature: Schema.Array(FieldElement),
    nonce: FieldElement,
  }),
});

export type InvokeTransactionV1 = typeof InvokeTransactionV1.Type;

export const InvokeTransactionV3 = Schema.Struct({
  _tag: tag("invokeV3"),
  invokeV3: Schema.Struct({
    senderAddress: FieldElement,
    calldata: Schema.Array(FieldElement),
    signature: Schema.Array(FieldElement),
    nonce: FieldElement,
    resourceBounds: ResourceBoundsMapping,
    tip: Schema.BigIntFromSelf,
    paymasterData: Schema.Array(FieldElement),
    accountDeploymentData: Schema.Array(FieldElement),
    nonceDataAvailabilityMode: DataAvailabilityMode,
    feeDataAvailabilityMode: DataAvailabilityMode,
  }),
});

export type InvokeTransactionV3 = typeof InvokeTransactionV3.Type;

export const L1HandlerTransaction = Schema.Struct({
  _tag: tag("l1Handler"),
  l1Handler: Schema.Struct({
    nonce: Schema.BigIntFromSelf,
    contractAddress: FieldElement,
    entryPointSelector: FieldElement,
    calldata: Schema.Array(FieldElement),
  }),
});

export type L1HandlerTransaction = typeof L1HandlerTransaction.Type;

export const DeployTransaction = Schema.Struct({
  _tag: tag("deploy"),
  deploy: Schema.Struct({
    contractAddressSalt: FieldElement,
    constructorCalldata: Schema.Array(FieldElement),
    classHash: FieldElement,
  }),
});

export type DeployTransaction = typeof DeployTransaction.Type;

export const DeclareTransactionV0 = Schema.Struct({
  _tag: tag("declareV0"),
  declareV0: Schema.Struct({
    senderAddress: FieldElement,
    maxFee: FieldElement,
    signature: Schema.Array(FieldElement),
    classHash: FieldElement,
  }),
});

export type DeclareTransactionV0 = typeof DeclareTransactionV0.Type;

export const DeclareTransactionV1 = Schema.Struct({
  _tag: tag("declareV1"),
  declareV1: Schema.Struct({
    senderAddress: FieldElement,
    maxFee: FieldElement,
    signature: Schema.Array(FieldElement),
    nonce: FieldElement,
    classHash: FieldElement,
  }),
});

export type DeclareTransactionV1 = typeof DeclareTransactionV1.Type;

export const DeclareTransactionV2 = Schema.Struct({
  _tag: tag("declareV2"),
  declareV2: Schema.Struct({
    senderAddress: FieldElement,
    compiledClassHash: FieldElement,
    maxFee: FieldElement,
    signature: Schema.Array(FieldElement),
    nonce: FieldElement,
    classHash: FieldElement,
  }),
});

export type DeclareTransactionV2 = typeof DeclareTransactionV2.Type;

export const DeclareTransactionV3 = Schema.Struct({
  _tag: tag("declareV3"),
  declareV3: Schema.Struct({
    senderAddress: FieldElement,
    compiledClassHash: FieldElement,
    signature: Schema.Array(FieldElement),
    nonce: FieldElement,
    classHash: FieldElement,
    resourceBounds: ResourceBoundsMapping,
    tip: Schema.BigIntFromSelf,
    paymasterData: Schema.Array(FieldElement),
    accountDeploymentData: Schema.Array(FieldElement),
    nonceDataAvailabilityMode: DataAvailabilityMode,
    feeDataAvailabilityMode: DataAvailabilityMode,
  }),
});

export type DeclareTransactionV3 = typeof DeclareTransactionV3.Type;

export const DeployAccountTransactionV1 = Schema.Struct({
  _tag: tag("deployAccountV1"),
  deployAccountV1: Schema.Struct({
    maxFee: FieldElement,
    signature: Schema.Array(FieldElement),
    nonce: FieldElement,
    contractAddressSalt: FieldElement,
    constructorCalldata: Schema.Array(FieldElement),
    classHash: FieldElement,
  }),
});

export type DeployAccountTransactionV1 = typeof DeployAccountTransactionV1.Type;

export const DeployAccountTransactionV3 = Schema.Struct({
  _tag: tag("deployAccountV3"),
  deployAccountV3: Schema.Struct({
    signature: Schema.Array(FieldElement),
    nonce: FieldElement,
    contractAddressSalt: FieldElement,
    constructorCalldata: Schema.Array(FieldElement),
    classHash: FieldElement,
    resourceBounds: ResourceBoundsMapping,
    tip: Schema.BigIntFromSelf,
    paymasterData: Schema.Array(FieldElement),
    nonceDataAvailabilityMode: DataAvailabilityMode,
    feeDataAvailabilityMode: DataAvailabilityMode,
  }),
});

export type DeployAccountTransactionV3 = typeof DeployAccountTransactionV3.Type;

/** A transaction.
 *
 * @prop meta Transaction metadata.
 */
export const Transaction = Schema.Struct({
  filterIds: Schema.Array(Schema.Number),
  meta: TransactionMeta,
  transaction: Schema.Union(
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

export type PriceUnit = typeof PriceUnit.Type;

export const FeePayment = Schema.Struct({
  amount: FieldElement,
  unit: PriceUnit,
});

export type FeePayment = typeof FeePayment.Type;

export const ComputationResources = Schema.Struct({
  steps: Schema.BigIntFromSelf,
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

export type ComputationResources = typeof ComputationResources.Type;

export const DataAvailabilityResources = Schema.Struct({
  l1Gas: Schema.BigIntFromSelf,
  l1DataGas: Schema.BigIntFromSelf,
});

export type DataAvailabilityResources = typeof DataAvailabilityResources.Type;

export const ExecutionResources = Schema.Struct({
  computation: ComputationResources,
  dataAvailability: DataAvailabilityResources,
});

export type ExecutionResources = typeof ExecutionResources.Type;

export const ExecutionSucceeded = Schema.Struct({
  _tag: tag("succeeded"),
  succeeded: Schema.Struct({}),
});

export type ExecutionSucceeded = typeof ExecutionSucceeded.Type;

export const ExecutionReverted = Schema.Struct({
  _tag: tag("reverted"),
  reverted: Schema.Struct({
    reason: Schema.optional(Schema.String),
  }),
});

export type ExecutionReverted = typeof ExecutionReverted.Type;

/** Common fields for all transaction receipts. */
export const TransactionReceiptMeta = Schema.Struct({
  transactionIndex: Schema.Number,
  transactionHash: FieldElement,
  actualFee: FeePayment,
  executionResources: ExecutionResources,
  executionResult: Schema.Union(ExecutionSucceeded, ExecutionReverted),
});

export type TransactionReceiptMeta = typeof TransactionReceiptMeta.Type;

export const InvokeTransactionReceipt = Schema.Struct({
  _tag: tag("invoke"),
  invoke: Schema.Struct({}),
});

export type InvokeTransactionReceipt = typeof InvokeTransactionReceipt.Type;

export const L1HandlerTransactionReceipt = Schema.Struct({
  _tag: tag("l1Handler"),
  l1Handler: Schema.Struct({
    messageHash: Schema.Uint8ArrayFromSelf,
  }),
});

export type L1HandlerTransactionReceipt =
  typeof L1HandlerTransactionReceipt.Type;

export const DeclareTransactionReceipt = Schema.Struct({
  _tag: tag("declare"),
  declare: Schema.Struct({}),
});

export type DeclareTransactionReceipt = typeof DeclareTransactionReceipt.Type;

export const DeployTransactionReceipt = Schema.Struct({
  _tag: tag("deploy"),
  deploy: Schema.Struct({
    contractAddress: FieldElement,
  }),
});

export type DeployTransactionReceipt = typeof DeployTransactionReceipt.Type;

export const DeployAccountTransactionReceipt = Schema.Struct({
  _tag: tag("deployAccount"),
  deployAccount: Schema.Struct({
    contractAddress: FieldElement,
  }),
});

export type DeployAccountTransactionReceipt =
  typeof DeployAccountTransactionReceipt.Type;

/** A transaction receipt.
 *
 * @prop meta Transaction receipt metadata.
 * @prop receipt Transaction-specific receipt.
 */
export const TransactionReceipt = Schema.Struct({
  filterIds: Schema.Array(Schema.Number),
  meta: TransactionReceiptMeta,
  receipt: Schema.Union(
    InvokeTransactionReceipt,
    L1HandlerTransactionReceipt,
    DeclareTransactionReceipt,
    DeployTransactionReceipt,
    DeployAccountTransactionReceipt,
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
 * @prop eventIndexInTransaction The event index in the transaction.
 */
export const Event = Schema.Struct({
  filterIds: Schema.Array(Schema.Number),
  address: FieldElement,
  keys: Schema.Array(FieldElement),
  data: Schema.Array(FieldElement),
  eventIndex: Schema.Number,
  transactionIndex: Schema.Number,
  transactionHash: FieldElement,
  transactionStatus: TransactionStatus,
  eventIndexInTransaction: Schema.Number,
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
 * @prop messageIndexInTransaction The message index in the transaction.
 */
export const MessageToL1 = Schema.Struct({
  filterIds: Schema.Array(Schema.Number),
  fromAddress: FieldElement,
  toAddress: FieldElement,
  payload: Schema.Array(FieldElement),
  messageIndex: Schema.Number,
  transactionIndex: Schema.Number,
  transactionHash: FieldElement,
  transactionStatus: TransactionStatus,
  messageIndexInTransaction: Schema.Number,
});

export type MessageToL1 = typeof MessageToL1.Type;

/** An entry in the storage diff.
 *
 * @prop key The storage location.
 * @prop value The new value at the storage location.
 */
export const StorageEntry = Schema.Struct({
  key: FieldElement,
  value: FieldElement,
});

export type StorageEntry = typeof StorageEntry.Type;

/** Storage diff.
 *
 * @prop contractAddress The contract address.
 * @prop storageEntries The entries that changed.
 */
export const StorageDiff = Schema.Struct({
  filterIds: Schema.Array(Schema.Number),
  contractAddress: FieldElement,
  storageEntries: Schema.Array(StorageEntry),
});

export type StorageDiff = typeof StorageDiff.Type;

/** A new class declared.
 *
 * @prop classHash The class hash.
 * @prop compiledClassHash The compiled class hash. If undefined, it's the result of a deprecated Cairo 0 declaration.
 */
export const DeclaredClass = Schema.Struct({
  _tag: tag("declaredClass"),
  declaredClass: Schema.Struct({
    classHash: Schema.optional(FieldElement),
    compiledClassHash: Schema.optional(FieldElement),
  }),
});

export type DeclaredClass = typeof DeclaredClass.Type;

/** A class replaced.
 *
 * @prop contractAddress The contract address.
 * @prop classHash The class new hash.
 */
export const ReplacedClass = Schema.Struct({
  _tag: tag("replacedClass"),
  replacedClass: Schema.Struct({
    contractAddress: Schema.optional(FieldElement),
    classHash: Schema.optional(FieldElement),
  }),
});

export type ReplacedClass = typeof ReplacedClass.Type;

/** A contract deployed.
 *
 * @prop contractAddress The contract address.
 * @prop classHash The class hash.
 */
export const DeployedContract = Schema.Struct({
  _tag: tag("deployedContract"),
  deployedContract: Schema.Struct({
    contractAddress: Schema.optional(FieldElement),
    classHash: Schema.optional(FieldElement),
  }),
});

export type DeployedContract = typeof DeployedContract.Type;

/** A contract change.
 *
 * @prop contractAddress The contract address.
 * @prop change The change.
 */
export const ContractChange = Schema.Struct({
  filterIds: Schema.Array(Schema.Number),
  change: Schema.Union(DeclaredClass, ReplacedClass, DeployedContract),
});

export type ContractChange = typeof ContractChange.Type;

/** A nonce update.
 *
 * @prop contractAddress The contract address.
 * @prop nonce The new nonce.
 */
export const NonceUpdate = Schema.Struct({
  filterIds: Schema.Array(Schema.Number),
  contractAddress: FieldElement,
  nonce: FieldElement,
});

export type NonceUpdate = typeof NonceUpdate.Type;

/** Trace call type. */
export const CallType = Schema.transform(
  Schema.Enums(proto.data.CallType),
  Schema.Literal("libraryCall", "call", "delegate", "unknown"),
  {
    decode(value) {
      const enumMap = {
        [proto.data.CallType.LIBRARY_CALL]: "libraryCall",
        [proto.data.CallType.CALL]: "call",
        [proto.data.CallType.DELEGATE]: "delegate",
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

/** A function invocation.
 *
 * @prop contractAddress The contract address.
 * @prop entryPointSelector The entry point selector.
 * @prop calldata The calldata.
 * @prop callerAddress The caller address.
 * @prop classHash The class hash.
 * @prop callType The call type.
 * @prop result The function invocation result.
 * @prop calls The nested function invocations.
 * @prop events The events index in the current transaction.
 * @prop messages The messages index in the current transaction.
 */
export class FunctionInvocation extends Schema.Class<FunctionInvocation>(
  "FunctionInvocation",
)({
  contractAddress: FieldElement,
  entryPointSelector: FieldElement,
  calldata: Schema.Array(FieldElement),
  callerAddress: FieldElement,
  classHash: FieldElement,
  callType: CallType,
  result: Schema.Array(FieldElement),
  calls: Schema.suspend(
    // biome-ignore lint/suspicious/noExplicitAny: not possible otherwise
    (): Schema.Schema<any> => Schema.Array(FunctionInvocation),
  ),
  events: Schema.Array(Schema.Number),
  messages: Schema.Array(Schema.Number),
}) {}

/** A successful invocation of the __execute__ call.
 *
 * @prop success The call.
 */
export const ExecuteInvocationSuccess = Schema.Struct({
  _tag: tag("success"),
  success: FunctionInvocation,
});

/** A failed invocation of the __execute__ call.
 *
 * @prop reason The reason for the failure.
 */
export const ExecuteInvocationReverted = Schema.Struct({
  _tag: tag("reverted"),
  reverted: Schema.Struct({
    reason: Schema.optional(Schema.String),
  }),
});

/** Trace for invoke transactions.
 *
 * @prop validateInvocation The __validate__ call.
 * @prop executeInvocation The __execute__ call.
 * @prop feeTransferInvocation The __fee_transfer__ call.
 */
export const InvokeTransactionTrace = Schema.Struct({
  _tag: tag("invoke"),
  invoke: Schema.Struct({
    validateInvocation: Schema.optional(FunctionInvocation),
    executeInvocation: Schema.Union(
      ExecuteInvocationReverted,
      ExecuteInvocationSuccess,
    ),
    feeTransferInvocation: Schema.optional(FunctionInvocation),
  }),
});

export type InvokeTransactionTrace = typeof InvokeTransactionTrace.Type;

/** Trace for declare transactions.
 *
 * @prop validateInvocation The __validate__ call.
 * @prop feeTransferInvocation The __fee_transfer__ call.
 */
export const DeclareTransactionTrace = Schema.Struct({
  _tag: tag("declare"),
  declare: Schema.Struct({
    validateInvocation: Schema.optional(FunctionInvocation),
    feeTransferInvocation: Schema.optional(FunctionInvocation),
  }),
});

export type DeclareTransactionTrace = typeof DeclareTransactionTrace.Type;

/** Trace for deploy account transactions.
 *
 * @prop validateInvocation The __validate__ call.
 * @prop constructorInvocation The __constructor__ call.
 * @prop feeTransferInvocation The __fee_transfer__ call.
 */
export const DeployAccountTransactionTrace = Schema.Struct({
  _tag: tag("deployAccount"),
  deployAccount: Schema.Struct({
    validateInvocation: Schema.optional(FunctionInvocation),
    constructorInvocation: Schema.optional(FunctionInvocation),
    feeTransferInvocation: Schema.optional(FunctionInvocation),
  }),
});

export type DeployAccountTransactionTrace =
  typeof DeployAccountTransactionTrace.Type;

/** Trace for L1 handler transactions.
 *
 * @prop functionInvocation The L1 handler function invocation.
 */
export const L1HandlerTransactionTrace = Schema.Struct({
  _tag: tag("l1Handler"),
  l1Handler: Schema.Struct({
    functionInvocation: Schema.optional(FunctionInvocation),
  }),
});

/** A transaction trace.
 *
 * @prop transactionHash The hash of the trace's transaction.
 * @prp traceRoot the trace root entry.
 */
export const TransactionTrace = Schema.Struct({
  filterIds: Schema.Array(Schema.Number),
  transactionIndex: Schema.Number,
  transactionHash: FieldElement,
  traceRoot: Schema.Union(
    InvokeTransactionTrace,
    DeclareTransactionTrace,
    DeployAccountTransactionTrace,
    L1HandlerTransactionTrace,
  ),
});

export type TransactionTrace = typeof TransactionTrace.Type;

/** A block.
 *
 * @prop header The block header.
 * @prop transactions The transactions in the block.
 * @prop receipts The receipts of the transactions.
 * @prop events The events emitted by the transactions.
 * @prop messages The messages sent to L1 by the transactions.
 * @prop traces The transaction traces.
 * @prop storageDiffs The changes to the storage.
 * @prop contractChanges The changes to contracts and classes.
 */
export const Block = Schema.Struct({
  header: BlockHeader,
  transactions: Schema.Array(Transaction),
  receipts: Schema.Array(TransactionReceipt),
  events: Schema.Array(Event),
  messages: Schema.Array(MessageToL1),
  traces: Schema.Array(TransactionTrace),
  storageDiffs: Schema.Array(StorageDiff),
  contractChanges: Schema.Array(ContractChange),
  nonceUpdates: Schema.Array(NonceUpdate),
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
