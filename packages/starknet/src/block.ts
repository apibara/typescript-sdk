import {
  ArrayCodec,
  BigIntCodec,
  type Codec,
  type CodecType,
  DateCodec,
  type Evaluate,
  MessageCodec,
  NumberCodec,
  OneOfCodec,
  OptionalCodec,
  RequiredCodec,
  StringCodec,
  Uint8ArrayCodec,
} from "@apibara/protocol/codec";
import { FieldElement } from "./common";
import * as proto from "./proto";

/** Price of a unit of resource.
 *
 * @prop priceInFri The price in Fri (1e-18 STRK).
 * @prop priceInWei The price in Wei (1e-18 ETH).
 */
export const ResourcePrice = MessageCodec({
  priceInFri: OptionalCodec(FieldElement),
  priceInWei: OptionalCodec(FieldElement),
});

export type ResourcePrice = Readonly<CodecType<typeof ResourcePrice>>;

// -----------------------------------------------------

/** How data is posted to L1. */
export const L1DataAvailabilityMode: Codec<
  "blob" | "calldata" | "unknown",
  proto.data.L1DataAvailabilityMode
> = {
  encode(x) {
    switch (x) {
      case "calldata":
        return proto.data.L1DataAvailabilityMode.CALLDATA;
      case "blob":
        return proto.data.L1DataAvailabilityMode.BLOB;
      case "unknown":
        return proto.data.L1DataAvailabilityMode.UNSPECIFIED;
      default:
        return proto.data.L1DataAvailabilityMode.UNRECOGNIZED;
    }
  },
  decode(p) {
    const enumMap = {
      [proto.data.L1DataAvailabilityMode.CALLDATA]: "calldata",
      [proto.data.L1DataAvailabilityMode.BLOB]: "blob",
      [proto.data.L1DataAvailabilityMode.UNSPECIFIED]: "unknown",
      [proto.data.L1DataAvailabilityMode.UNRECOGNIZED]: "unknown",
    } as const;

    return enumMap[p] ?? "unknown";
  },
};

export type L1DataAvailabilityMode = CodecType<typeof L1DataAvailabilityMode>;

// -----------------------------------------------------

/** Status of a transaction. */
export const TransactionStatus: Codec<
  "unknown" | "succeeded" | "reverted",
  proto.data.TransactionStatus
> = {
  encode(x) {
    switch (x) {
      case "succeeded":
        return proto.data.TransactionStatus.SUCCEEDED;
      case "reverted":
        return proto.data.TransactionStatus.REVERTED;
      case "unknown":
        return proto.data.TransactionStatus.UNSPECIFIED;
      default:
        return proto.data.TransactionStatus.UNRECOGNIZED;
    }
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

// -----------------------------------------------------

/** 128-bit unsigned integer. */
export const U128: Codec<bigint, proto.data.Uint128> = {
  // TODO: double check if this is correct
  encode(x) {
    const low = x.toString(16).padStart(16, "0");
    const high = (x >> 128n).toString(16).padStart(16, "0");
    return { x0: BigInt(`0x${low}`), x1: BigInt(`0x${high}`) };
  },
  decode(p) {
    const low = p.x0?.toString(16).padStart(16, "0");
    const high = p.x1?.toString(16).padStart(16, "0");
    return BigInt(`0x${low}${high}`);
  },
};

export type U128 = CodecType<typeof U128>;

// -----------------------------------------------------

/** Resource bounds. */
export const ResourceBounds = MessageCodec({
  maxAmount: RequiredCodec(BigIntCodec),
  maxPricePerUnit: RequiredCodec(U128),
});

export type ResourceBounds = Readonly<CodecType<typeof ResourceBounds>>;

// -----------------------------------------------------

/** Resource bounds mapping. */
export const ResourceBoundsMapping = MessageCodec({
  l1Gas: RequiredCodec(ResourceBounds),
  l2Gas: RequiredCodec(ResourceBounds),
});

export type ResourceBoundsMapping = Readonly<
  CodecType<typeof ResourceBoundsMapping>
>;

// -----------------------------------------------------

/** Data availability mode. */
export const DataAvailabilityMode: Codec<
  "l1" | "l2" | "unknown",
  proto.data.DataAvailabilityMode
> = {
  encode(x) {
    switch (x) {
      case "l1":
        return proto.data.DataAvailabilityMode.L1;
      case "l2":
        return proto.data.DataAvailabilityMode.L2;
      case "unknown":
        return proto.data.DataAvailabilityMode.UNSPECIFIED;
      default:
        return proto.data.DataAvailabilityMode.UNRECOGNIZED;
    }
  },
  decode(p) {
    const enumMap = {
      [proto.data.DataAvailabilityMode.L1]: "l1",
      [proto.data.DataAvailabilityMode.L2]: "l2",
      [proto.data.DataAvailabilityMode.UNSPECIFIED]: "unknown",
      [proto.data.DataAvailabilityMode.UNRECOGNIZED]: "unknown",
    } as const;

    return enumMap[p] ?? "unknown";
  },
};

export type DataAvailabilityMode = CodecType<typeof DataAvailabilityMode>;

// -----------------------------------------------------

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
export const BlockHeader = MessageCodec({
  blockHash: OptionalCodec(FieldElement),
  parentBlockHash: RequiredCodec(FieldElement),
  blockNumber: RequiredCodec(BigIntCodec),
  sequencerAddress: RequiredCodec(FieldElement),
  newRoot: OptionalCodec(FieldElement),
  timestamp: RequiredCodec(DateCodec),
  starknetVersion: RequiredCodec(StringCodec),
  l1GasPrice: RequiredCodec(ResourcePrice),
  l1DataGasPrice: RequiredCodec(ResourcePrice),
  l1DataAvailabilityMode: RequiredCodec(L1DataAvailabilityMode),
});

export type BlockHeader = Readonly<CodecType<typeof BlockHeader>>;

// -----------------------------------------------------

/** Transaction metadata.
 *
 * This is the information that is common between all transaction types.
 *
 * @prop transactionIndex The transaction index in the block.
 * @prop transactionHash The transaction hash.
 * @prop transactionStatus The transaction status.
 */
export const TransactionMeta = MessageCodec({
  transactionIndex: RequiredCodec(NumberCodec),
  transactionHash: RequiredCodec(FieldElement),
  transactionStatus: RequiredCodec(TransactionStatus),
});

export type TransactionMeta = Readonly<CodecType<typeof TransactionMeta>>;

// -----------------------------------------------------

/** Invoke transaction v0.
 *
 * @prop maxFee The maximum fee.
 * @prop signature The signature.
 * @prop contractAddress The contract address.
 * @prop entryPointSelector The entry point selector.
 * @prop calldata The calldata.
 */
export const InvokeTransactionV0 = MessageCodec({
  maxFee: RequiredCodec(FieldElement),
  signature: ArrayCodec(FieldElement),
  contractAddress: RequiredCodec(FieldElement),
  entryPointSelector: RequiredCodec(FieldElement),
  calldata: ArrayCodec(FieldElement),
});

export type InvokeTransactionV0 = Readonly<
  CodecType<typeof InvokeTransactionV0>
>;

// -----------------------------------------------------

/** Invoke transaction v1.
 *
 * @prop senderAddress The sender address.
 * @prop calldata The calldata.
 * @prop maxFee The maximum fee.
 * @prop signature The signature.
 * @prop nonce The nonce.
 */
export const InvokeTransactionV1 = MessageCodec({
  senderAddress: RequiredCodec(FieldElement),
  calldata: ArrayCodec(FieldElement),
  maxFee: RequiredCodec(FieldElement),
  signature: ArrayCodec(FieldElement),
  nonce: RequiredCodec(FieldElement),
});

export type InvokeTransactionV1 = Readonly<
  CodecType<typeof InvokeTransactionV1>
>;

// -----------------------------------------------------

/** Invoke transaction v3.
 *
 * @prop senderAddress The sender address.
 * @prop calldata The calldata.
 * @prop signature The signature.
 * @prop nonce The nonce.
 * @prop resourceBounds The resource bounds.
 * @prop tip The tip.
 * @prop paymasterData The paymaster data.
 * @prop accountDeploymentData The account deployment data.
 * @prop nonceDataAvailabilityMode How nonce data is posted to L1.
 * @prop feeDataAvailabilityMode How fee data is posted to L1.
 */
export const InvokeTransactionV3 = MessageCodec({
  senderAddress: RequiredCodec(FieldElement),
  calldata: ArrayCodec(FieldElement),
  signature: ArrayCodec(FieldElement),
  nonce: RequiredCodec(FieldElement),
  resourceBounds: RequiredCodec(ResourceBoundsMapping),
  tip: RequiredCodec(BigIntCodec),
  paymasterData: ArrayCodec(FieldElement),
  accountDeploymentData: ArrayCodec(FieldElement),
  nonceDataAvailabilityMode: RequiredCodec(DataAvailabilityMode),
  feeDataAvailabilityMode: RequiredCodec(DataAvailabilityMode),
});

export type InvokeTransactionV3 = Readonly<
  CodecType<typeof InvokeTransactionV3>
>;

// -----------------------------------------------------

/** L1 handler transaction.
 *
 * @prop nonce The nonce.
 * @prop contractAddress The contract address.
 * @prop entryPointSelector The entry point selector.
 * @prop calldata The calldata.
 */
export const L1HandlerTransaction = MessageCodec({
  nonce: RequiredCodec(BigIntCodec),
  contractAddress: RequiredCodec(FieldElement),
  entryPointSelector: RequiredCodec(FieldElement),
  calldata: ArrayCodec(FieldElement),
});

export type L1HandlerTransaction = Readonly<
  CodecType<typeof L1HandlerTransaction>
>;

// -----------------------------------------------------

/** Deploy transaction.
 *
 * @prop contractAddressSalt The contract address salt.
 * @prop constructorCalldata The constructor calldata.
 * @prop classHash The class hash.
 */
export const DeployTransaction = MessageCodec({
  contractAddressSalt: RequiredCodec(FieldElement),
  constructorCalldata: ArrayCodec(FieldElement),
  classHash: RequiredCodec(FieldElement),
});

export type DeployTransaction = Readonly<CodecType<typeof DeployTransaction>>;

// -----------------------------------------------------

/** Declare transaction v0.
 *
 * @prop senderAddress The sender address.
 * @prop maxFee The maximum fee.
 * @prop signature The signature.
 * @prop classHash The class hash.
 */
export const DeclareTransactionV0 = MessageCodec({
  senderAddress: RequiredCodec(FieldElement),
  maxFee: RequiredCodec(FieldElement),
  signature: ArrayCodec(FieldElement),
  classHash: RequiredCodec(FieldElement),
});

export type DeclareTransactionV0 = Readonly<
  CodecType<typeof DeclareTransactionV0>
>;

// -----------------------------------------------------

/** Declare transaction v1.
 *
 * @prop senderAddress The sender address.
 * @prop maxFee The maximum fee.
 * @prop signature The signature.
 * @prop nonce The nonce.
 * @prop classHash The class hash.
 */
export const DeclareTransactionV1 = MessageCodec({
  senderAddress: RequiredCodec(FieldElement),
  maxFee: RequiredCodec(FieldElement),
  signature: ArrayCodec(FieldElement),
  nonce: RequiredCodec(FieldElement),
  classHash: RequiredCodec(FieldElement),
});

export type DeclareTransactionV1 = Readonly<
  CodecType<typeof DeclareTransactionV1>
>;

// -----------------------------------------------------

/** Declare transaction v2.
 *
 * @prop senderAddress The sender address.
 * @prop compiledClassHash The compiled class hash.
 * @prop maxFee The maximum fee.
 * @prop signature The signature.
 * @prop nonce The nonce.
 * @prop classHash The class hash.
 */
export const DeclareTransactionV2 = MessageCodec({
  senderAddress: RequiredCodec(FieldElement),
  compiledClassHash: RequiredCodec(FieldElement),
  maxFee: RequiredCodec(FieldElement),
  signature: ArrayCodec(FieldElement),
  nonce: RequiredCodec(FieldElement),
  classHash: RequiredCodec(FieldElement),
});

export type DeclareTransactionV2 = Readonly<
  CodecType<typeof DeclareTransactionV2>
>;

// -----------------------------------------------------

/** Declare transaction v3.
 *
 * @prop senderAddress The sender address.
 * @prop compiledClassHash The compiled class hash.
 * @prop signature The signature.
 * @prop nonce The nonce.
 * @prop classHash The class hash.
 * @prop resourceBounds The resource bounds.
 * @prop tip The tip.
 * @prop paymasterData The paymaster data.
 * @prop nonceDataAvailabilityMode How nonce data is posted to L1.
 * @prop feeDataAvailabilityMode How fee data is posted to L1.
 */
export const DeclareTransactionV3 = MessageCodec({
  senderAddress: RequiredCodec(FieldElement),
  compiledClassHash: RequiredCodec(FieldElement),
  signature: ArrayCodec(FieldElement),
  nonce: RequiredCodec(FieldElement),
  classHash: RequiredCodec(FieldElement),
  resourceBounds: RequiredCodec(ResourceBoundsMapping),
  tip: RequiredCodec(BigIntCodec),
  paymasterData: ArrayCodec(FieldElement),
  accountDeploymentData: ArrayCodec(FieldElement),
  nonceDataAvailabilityMode: RequiredCodec(DataAvailabilityMode),
  feeDataAvailabilityMode: RequiredCodec(DataAvailabilityMode),
});

export type DeclareTransactionV3 = Readonly<
  CodecType<typeof DeclareTransactionV3>
>;

// -----------------------------------------------------

/** Deploy account transaction v1.
 *
 * @prop maxFee The maximum fee.
 * @prop signature The signature.
 * @prop nonce The nonce.
 * @prop contractAddressSalt The contract address salt.
 * @prop constructorCalldata The constructor calldata.
 * @prop classHash The class hash.
 */
export const DeployAccountTransactionV1 = MessageCodec({
  maxFee: RequiredCodec(FieldElement),
  signature: ArrayCodec(FieldElement),
  nonce: RequiredCodec(FieldElement),
  contractAddressSalt: RequiredCodec(FieldElement),
  constructorCalldata: ArrayCodec(FieldElement),
  classHash: RequiredCodec(FieldElement),
});

export type DeployAccountTransactionV1 = Readonly<
  CodecType<typeof DeployAccountTransactionV1>
>;

// -----------------------------------------------------

/** Deploy account transaction v3.
 *
 * @prop signature The signature.
 * @prop nonce The nonce.
 * @prop contractAddressSalt The contract address salt.
 * @prop constructorCalldata The constructor calldata.
 * @prop classHash The class hash.
 * @prop resourceBounds The resource bounds.
 * @prop tip The tip.
 * @prop paymasterData The paymaster data.
 * @prop nonceDataAvailabilityMode How nonce data is posted to L1.
 * @prop feeDataAvailabilityMode How fee data is posted to L1.
 */
export const DeployAccountTransactionV3 = MessageCodec({
  signature: ArrayCodec(FieldElement),
  nonce: RequiredCodec(FieldElement),
  contractAddressSalt: RequiredCodec(FieldElement),
  constructorCalldata: ArrayCodec(FieldElement),
  classHash: RequiredCodec(FieldElement),
  resourceBounds: RequiredCodec(ResourceBoundsMapping),
  tip: RequiredCodec(BigIntCodec),
  paymasterData: ArrayCodec(FieldElement),
  nonceDataAvailabilityMode: RequiredCodec(DataAvailabilityMode),
  feeDataAvailabilityMode: RequiredCodec(DataAvailabilityMode),
});

export type DeployAccountTransactionV3 = Readonly<
  CodecType<typeof DeployAccountTransactionV3>
>;

// -----------------------------------------------------

/** A transaction.
 *
 * @prop filterIds The filter IDs.
 * @prop meta The transaction metadata.
 */
export const Transaction = MessageCodec({
  filterIds: ArrayCodec(NumberCodec),
  meta: RequiredCodec(TransactionMeta),
  transaction: RequiredCodec(
    OneOfCodec({
      invokeV0: InvokeTransactionV0,
      invokeV1: InvokeTransactionV1,
      invokeV3: InvokeTransactionV3,
      l1Handler: L1HandlerTransaction,
      deploy: DeployTransaction,
      declareV0: DeclareTransactionV0,
      declareV1: DeclareTransactionV1,
      declareV2: DeclareTransactionV2,
      declareV3: DeclareTransactionV3,
      deployAccountV1: DeployAccountTransactionV1,
      deployAccountV3: DeployAccountTransactionV3,
    }),
  ),
});

export type Transaction = Readonly<CodecType<typeof Transaction>>;

// -----------------------------------------------------

export const PriceUnit: Codec<"wei" | "fri" | "unknown", proto.data.PriceUnit> =
  {
    encode(x) {
      switch (x) {
        case "wei":
          return proto.data.PriceUnit.WEI;
        case "fri":
          return proto.data.PriceUnit.FRI;
        case "unknown":
          return proto.data.PriceUnit.UNSPECIFIED;
        default:
          return proto.data.PriceUnit.UNRECOGNIZED;
      }
    },
    decode(p) {
      const enumMap = {
        [proto.data.PriceUnit.WEI]: "wei",
        [proto.data.PriceUnit.FRI]: "fri",
        [proto.data.PriceUnit.UNSPECIFIED]: "unknown",
        [proto.data.PriceUnit.UNRECOGNIZED]: "unknown",
      } as const;

      return enumMap[p] ?? "unknown";
    },
  };

export type PriceUnit = CodecType<typeof PriceUnit>;

// -----------------------------------------------------

export const FeePayment = MessageCodec({
  amount: RequiredCodec(FieldElement),
  unit: RequiredCodec(PriceUnit),
});

export type FeePayment = Readonly<CodecType<typeof FeePayment>>;

// -----------------------------------------------------

export const ComputationResources = MessageCodec({
  steps: RequiredCodec(BigIntCodec),
  memoryHoles: OptionalCodec(BigIntCodec),
  rangeCheckBuiltinApplications: OptionalCodec(BigIntCodec),
  pedersenBuiltinApplications: OptionalCodec(BigIntCodec),
  poseidonBuiltinApplications: OptionalCodec(BigIntCodec),
  ecOpBuiltinApplications: OptionalCodec(BigIntCodec),
  ecdsaBuiltinApplications: OptionalCodec(BigIntCodec),
  bitwiseBuiltinApplications: OptionalCodec(BigIntCodec),
  keccakBuiltinApplications: OptionalCodec(BigIntCodec),
  segmentArenaBuiltin: OptionalCodec(BigIntCodec),
});

export type ComputationResources = Readonly<
  CodecType<typeof ComputationResources>
>;

// -----------------------------------------------------

export const DataAvailabilityResources = MessageCodec({
  l1Gas: RequiredCodec(BigIntCodec),
  l1DataGas: RequiredCodec(BigIntCodec),
});

export type DataAvailabilityResources = Readonly<
  CodecType<typeof DataAvailabilityResources>
>;

// -----------------------------------------------------

export const ExecutionResources = MessageCodec({
  computation: RequiredCodec(ComputationResources),
  dataAvailability: RequiredCodec(DataAvailabilityResources),
});

export type ExecutionResources = Readonly<CodecType<typeof ExecutionResources>>;

// -----------------------------------------------------

export const ExecutionSucceeded = MessageCodec({});

export type ExecutionSucceeded = Readonly<CodecType<typeof ExecutionSucceeded>>;

// -----------------------------------------------------

export const ExecutionReverted = MessageCodec({
  reason: OptionalCodec(StringCodec),
});

export type ExecutionReverted = Readonly<CodecType<typeof ExecutionReverted>>;

// -----------------------------------------------------

export const TransactionReceiptMeta = MessageCodec({
  transactionIndex: RequiredCodec(NumberCodec),
  transactionHash: RequiredCodec(FieldElement),
  actualFee: RequiredCodec(FeePayment),
  executionResources: RequiredCodec(ExecutionResources),
  executionResult: RequiredCodec(
    OneOfCodec({
      succeeded: ExecutionSucceeded,
      reverted: ExecutionReverted,
    }),
  ),
});

export type TransactionReceiptMeta = Readonly<
  CodecType<typeof TransactionReceiptMeta>
>;

// -----------------------------------------------------

export const InvokeTransactionReceipt = MessageCodec({});

export type InvokeTransactionReceipt = Readonly<
  CodecType<typeof InvokeTransactionReceipt>
>;

// -----------------------------------------------------

export const L1HandlerTransactionReceipt = MessageCodec({
  messageHash: RequiredCodec(Uint8ArrayCodec),
});

export type L1HandlerTransactionReceipt = Readonly<
  CodecType<typeof L1HandlerTransactionReceipt>
>;

// -----------------------------------------------------

export const DeclareTransactionReceipt = MessageCodec({});

export type DeclareTransactionReceipt = Readonly<
  CodecType<typeof DeclareTransactionReceipt>
>;

// -----------------------------------------------------

export const DeployTransactionReceipt = MessageCodec({
  contractAddress: RequiredCodec(FieldElement),
});

export type DeployTransactionReceipt = Readonly<
  CodecType<typeof DeployTransactionReceipt>
>;

// -----------------------------------------------------

export const DeployAccountTransactionReceipt = MessageCodec({
  contractAddress: RequiredCodec(FieldElement),
});

export type DeployAccountTransactionReceipt = Readonly<
  CodecType<typeof DeployAccountTransactionReceipt>
>;

// -----------------------------------------------------

/** A transaction receipt.
 *
 * @prop meta Transaction receipt metadata.
 * @prop receipt Transaction-specific receipt.
 */
export const TransactionReceipt = MessageCodec({
  filterIds: ArrayCodec(NumberCodec),
  meta: RequiredCodec(TransactionReceiptMeta),
  receipt: RequiredCodec(
    OneOfCodec({
      invoke: InvokeTransactionReceipt,
      l1Handler: L1HandlerTransactionReceipt,
      declare: DeclareTransactionReceipt,
      deploy: DeployTransactionReceipt,
      deployAccount: DeployAccountTransactionReceipt,
    }),
  ),
});

export type TransactionReceipt = Readonly<CodecType<typeof TransactionReceipt>>;

// -----------------------------------------------------

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
export const Event = MessageCodec({
  filterIds: ArrayCodec(NumberCodec),
  address: RequiredCodec(FieldElement),
  keys: ArrayCodec(FieldElement),
  data: ArrayCodec(FieldElement),
  eventIndex: RequiredCodec(NumberCodec),
  transactionIndex: RequiredCodec(NumberCodec),
  transactionHash: RequiredCodec(FieldElement),
  transactionStatus: RequiredCodec(TransactionStatus),
  eventIndexInTransaction: RequiredCodec(NumberCodec),
});

export type Event = Readonly<CodecType<typeof Event>>;

// -----------------------------------------------------

/** A message from the L2 to the L1.
 *
 * @prop filterIds The filter IDs.
 * @prop fromAddress The address on L2 that sent the message.
 * @prop toAddress The address on L1 that will receive the message.
 * @prop payload The message payload.
 * @prop messageIndex The message index in the block.
 * @prop transactionIndex The transaction index in the block.
 * @prop transactionHash The transaction hash.
 * @prop transactionStatus The transaction status.
 * @prop messageIndexInTransaction The message index in the transaction.
 */
export const MessageToL1 = MessageCodec({
  filterIds: ArrayCodec(NumberCodec),
  fromAddress: RequiredCodec(FieldElement),
  toAddress: RequiredCodec(FieldElement),
  payload: ArrayCodec(FieldElement),
  messageIndex: RequiredCodec(NumberCodec),
  transactionIndex: RequiredCodec(NumberCodec),
  transactionHash: RequiredCodec(FieldElement),
  transactionStatus: RequiredCodec(TransactionStatus),
  messageIndexInTransaction: RequiredCodec(NumberCodec),
});

export type MessageToL1 = Readonly<CodecType<typeof MessageToL1>>;

// -----------------------------------------------------

/** An entry in the storage diff.
 *
 * @prop key The storage location.
 * @prop value The new value at the storage location.
 */
export const StorageEntry = MessageCodec({
  key: RequiredCodec(FieldElement),
  value: RequiredCodec(FieldElement),
});

export type StorageEntry = Readonly<CodecType<typeof StorageEntry>>;

// -----------------------------------------------------

/** Storage diff.
 *
 * @prop contractAddress The contract address.
 * @prop storageEntries The entries that changed.
 */
export const StorageDiff = MessageCodec({
  filterIds: ArrayCodec(NumberCodec),
  contractAddress: RequiredCodec(FieldElement),
  storageEntries: ArrayCodec(StorageEntry),
});

export type StorageDiff = Readonly<CodecType<typeof StorageDiff>>;

// -----------------------------------------------------

/** A new class declared.
 *
 * @prop classHash The class hash.
 * @prop compiledClassHash The compiled class hash. If undefined, it's the result of a deprecated Cairo 0 declaration.
 */
export const DeclaredClass = MessageCodec({
  classHash: OptionalCodec(FieldElement),
  compiledClassHash: OptionalCodec(FieldElement),
});

export type DeclaredClass = Readonly<CodecType<typeof DeclaredClass>>;

// -----------------------------------------------------

/** A class replaced.
 *
 * @prop contractAddress The contract address.
 * @prop classHash The class new hash.
 */
export const ReplacedClass = MessageCodec({
  contractAddress: OptionalCodec(FieldElement),
  classHash: OptionalCodec(FieldElement),
});

export type ReplacedClass = Readonly<CodecType<typeof ReplacedClass>>;

// -----------------------------------------------------

/** A contract deployed.
 *
 * @prop contractAddress The contract address.
 * @prop classHash The class hash.
 */
export const DeployedContract = MessageCodec({
  contractAddress: OptionalCodec(FieldElement),
  classHash: OptionalCodec(FieldElement),
});

export type DeployedContract = Readonly<CodecType<typeof DeployedContract>>;

// -----------------------------------------------------

/** A contract change.
 *
 * @prop filterIds The filter IDs.
 * @prop change The change.
 */
export const ContractChange = MessageCodec({
  filterIds: ArrayCodec(NumberCodec),
  change: RequiredCodec(
    OneOfCodec({
      declaredClass: DeclaredClass,
      replacedClass: ReplacedClass,
      deployedContract: DeployedContract,
    }),
  ),
});

export type ContractChange = Readonly<CodecType<typeof ContractChange>>;

// -----------------------------------------------------

/** A nonce update.
 *
 * @prop contractAddress The contract address.
 * @prop nonce The new nonce.
 */
export const NonceUpdate = MessageCodec({
  filterIds: ArrayCodec(NumberCodec),
  contractAddress: RequiredCodec(FieldElement),
  nonce: RequiredCodec(FieldElement),
});

export type NonceUpdate = Readonly<CodecType<typeof NonceUpdate>>;

// -----------------------------------------------------

export const CallType: Codec<
  "libraryCall" | "call" | "delegate" | "unknown",
  proto.data.CallType
> = {
  encode(x) {
    switch (x) {
      case "libraryCall":
        return proto.data.CallType.LIBRARY_CALL;
      case "call":
        return proto.data.CallType.CALL;
      case "delegate":
        return proto.data.CallType.DELEGATE;
      case "unknown":
        return proto.data.CallType.UNSPECIFIED;
      default:
        return proto.data.CallType.UNRECOGNIZED;
    }
  },
  decode(p) {
    const enumMap = {
      [proto.data.CallType.LIBRARY_CALL]: "libraryCall",
      [proto.data.CallType.CALL]: "call",
      [proto.data.CallType.DELEGATE]: "delegate",
      [proto.data.CallType.UNSPECIFIED]: "unknown",
      [proto.data.CallType.UNRECOGNIZED]: "unknown",
    } as const;

    return enumMap[p] ?? "unknown";
  },
};

export type CallType = CodecType<typeof CallType>;

// -----------------------------------------------------

const _FunctionInvocationCodec = MessageCodec({
  contractAddress: RequiredCodec(FieldElement),
  entryPointSelector: RequiredCodec(FieldElement),
  calldata: ArrayCodec(FieldElement),
  callerAddress: RequiredCodec(FieldElement),
  classHash: RequiredCodec(FieldElement),
  callType: RequiredCodec(CallType),
  result: ArrayCodec(FieldElement),
  events: ArrayCodec(NumberCodec),
  messages: ArrayCodec(NumberCodec),
});

/**
 * @note This is a recursive type.
 */
export type FunctionInvocation = Evaluate<
  CodecType<typeof _FunctionInvocationCodec> & {
    calls: FunctionInvocation[];
  }
>;

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
const FunctionInvocationCodec: Codec<
  FunctionInvocation,
  proto.data.FunctionInvocation
> = {
  encode(x) {
    const { calls, ...rest } = x;
    const encodedCalls = calls.map(FunctionInvocationCodec.encode);
    const encodedRest = _FunctionInvocationCodec.encode(rest);
    return { calls: encodedCalls, ...encodedRest };
  },
  decode(p) {
    const { calls = [], ...rest } = p;
    const decodedCalls = calls.map(FunctionInvocationCodec.decode);
    const decodedRest = _FunctionInvocationCodec.decode(rest);
    return { ...decodedRest, calls: decodedCalls };
  },
};

// -----------------------------------------------------

/** A successful invocation of the __execute__ call.
 *
 * The call.
 */
export const ExecuteInvocationSuccess = FunctionInvocationCodec;

// -----------------------------------------------------

/** A failed invocation of the __execute__ call.
 *
 * @prop reason The reason for the failure.
 */
export const ExecuteInvocationReverted = MessageCodec({
  reason: OptionalCodec(StringCodec),
});

// -----------------------------------------------------

/** Trace for invoke transactions.
 *
 * @prop validateInvocation The __validate__ call.
 * @prop executeInvocation The __execute__ call.
 * @prop feeTransferInvocation The __fee_transfer__ call.
 */
export const InvokeTransactionTrace = MessageCodec({
  validateInvocation: OptionalCodec(FunctionInvocationCodec),
  executeInvocation: RequiredCodec(
    OneOfCodec({
      success: ExecuteInvocationSuccess,
      reverted: ExecuteInvocationReverted,
    }),
  ),
  feeTransferInvocation: OptionalCodec(FunctionInvocationCodec),
});

export type InvokeTransactionTrace = Readonly<
  CodecType<typeof InvokeTransactionTrace>
>;

// -----------------------------------------------------

/** Trace for declare transactions.
 *
 * @prop validateInvocation The __validate__ call.
 * @prop feeTransferInvocation The __fee_transfer__ call.
 */
export const DeclareTransactionTrace = MessageCodec({
  validateInvocation: OptionalCodec(FunctionInvocationCodec),
  feeTransferInvocation: OptionalCodec(FunctionInvocationCodec),
});

export type DeclareTransactionTrace = Readonly<
  CodecType<typeof DeclareTransactionTrace>
>;

// -----------------------------------------------------

/** Trace for deploy account transactions.
 *
 * @prop validateInvocation The __validate__ call.
 * @prop constructorInvocation The __constructor__ invocation.
 * @prop feeTransferInvocation The __fee_transfer__ call.
 */
export const DeployAccountTransactionTrace = MessageCodec({
  validateInvocation: OptionalCodec(FunctionInvocationCodec),
  constructorInvocation: OptionalCodec(FunctionInvocationCodec),
  feeTransferInvocation: OptionalCodec(FunctionInvocationCodec),
});

export type DeployAccountTransactionTrace = Readonly<
  CodecType<typeof DeployAccountTransactionTrace>
>;

// -----------------------------------------------------

/** Trace for L1 handler transactions.
 *
 * @prop functionInvocation The L1 handler function invocation.
 */
export const L1HandlerTransactionTrace = MessageCodec({
  functionInvocation: OptionalCodec(FunctionInvocationCodec),
});

export type L1HandlerTransactionTrace = Readonly<
  CodecType<typeof L1HandlerTransactionTrace>
>;

// -----------------------------------------------------

/** A transaction trace.
 *
 * @prop filterIds The filter IDs.
 * @prop transactionIndex The transaction index.
 * @prop transactionHash The transaction hash.
 * @prop traceRoot The trace root.
 */
export const TransactionTrace = MessageCodec({
  filterIds: ArrayCodec(NumberCodec),
  transactionIndex: RequiredCodec(NumberCodec),
  transactionHash: RequiredCodec(FieldElement),
  traceRoot: RequiredCodec(
    OneOfCodec({
      invoke: InvokeTransactionTrace,
      declare: DeclareTransactionTrace,
      deployAccount: DeployAccountTransactionTrace,
      l1Handler: L1HandlerTransactionTrace,
    }),
  ),
});

export type TransactionTrace = Readonly<CodecType<typeof TransactionTrace>>;

// -----------------------------------------------------

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
 * @prop nonceUpdates The nonce updates.
 */
export const Block = MessageCodec({
  header: RequiredCodec(BlockHeader),
  transactions: ArrayCodec(Transaction),
  receipts: ArrayCodec(TransactionReceipt),
  events: ArrayCodec(Event),
  messages: ArrayCodec(MessageToL1),
  traces: ArrayCodec(TransactionTrace),
  storageDiffs: ArrayCodec(StorageDiff),
  contractChanges: ArrayCodec(ContractChange),
  nonceUpdates: ArrayCodec(NonceUpdate),
});

export type Block = Readonly<CodecType<typeof Block>>;

// -----------------------------------------------------

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
