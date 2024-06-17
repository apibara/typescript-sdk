import { Schema } from "@effect/schema";

import * as proto from "./proto";
import { FieldElement } from "./common";
import { tag } from "./helpers";

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

export const U128 = Schema.transform(
  Schema.Struct({
    low: Schema.BigIntFromSelf,
    high: Schema.BigIntFromSelf,
  }),
  Schema.BigIntFromSelf,
  {
    decode(value) {
      const low = value.low.toString(16).padStart(16, "0");
      const high = value.high.toString(16).padStart(16, "0");
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
 * @prop transactionReverted Whether the transaction was reverted.
 */
export const TransactionMeta = Schema.Struct({
  transactionIndex: Schema.optional(Schema.Number),
  transactionHash: Schema.optional(FieldElement),
  transactionReverted: Schema.optional(Schema.Boolean),
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

export const L1HandleTransaction = Schema.Struct({
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
  meta: Schema.optional(TransactionMeta),
  transaction: Schema.optional(
    Schema.Union(
      InvokeTransactionV0,
      InvokeTransactionV1,
      InvokeTransactionV3,
      L1HandleTransaction,
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

export const TransactionReceipt = Schema.Struct({});

export type TransactionReceipt = typeof TransactionReceipt.Type;

export const Event = Schema.Struct({
  fromAddress: Schema.optional(FieldElement),
  keys: Schema.optional(Schema.Array(FieldElement)),
  eventIndex: Schema.optional(Schema.Number),
});

export type Event = typeof Event.Type;

export const MessageToL1 = Schema.Struct({
  toAddress: Schema.optional(FieldElement),
  messageIndex: Schema.optional(Schema.Number),
});

export type MessageToL1 = typeof MessageToL1.Type;

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
