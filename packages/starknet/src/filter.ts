import { Schema } from "@effect/schema";

import { FieldElement, FieldElementProto } from "./common";
import { tag } from "./helpers";
import * as proto from "./proto";

/** Header options.
 *
 * - `always`: receive all block headers.
 * - `on_data`: receive headers only if any other filter matches.
 * - `on_data_or_on_new_block`: receive headers only if any other filter matches and for "live" blocks.
 */
export const HeaderFilter = Schema.transform(
  Schema.Enums(proto.filter.HeaderFilter),
  Schema.Literal("always", "on_data", "on_data_or_on_new_block", "unknown"),
  {
    decode(value) {
      const enumMap = {
        [proto.filter.HeaderFilter.ALWAYS]: "always",
        [proto.filter.HeaderFilter.ON_DATA]: "on_data",
        [proto.filter.HeaderFilter.ON_DATA_OR_ON_NEW_BLOCK]:
          "on_data_or_on_new_block",
        [proto.filter.HeaderFilter.UNSPECIFIED]: "unknown",
        [proto.filter.HeaderFilter.UNRECOGNIZED]: "unknown",
      } as const;
      return enumMap[value] ?? "unknown";
    },
    encode(value) {
      switch (value) {
        case "always":
          return proto.filter.HeaderFilter.ALWAYS;
        case "on_data":
          return proto.filter.HeaderFilter.ON_DATA;
        case "on_data_or_on_new_block":
          return proto.filter.HeaderFilter.ON_DATA_OR_ON_NEW_BLOCK;
        default:
          return proto.filter.HeaderFilter.UNSPECIFIED;
      }
    },
  },
);

export type HeaderFilter = typeof HeaderFilter.Type;

/** An event key filter. Use `null` to match any event key. */
export const Key = Schema.transform(
  Schema.Struct({ value: Schema.UndefinedOr(FieldElementProto) }),
  Schema.NullOr(FieldElement),
  {
    decode({ value }) {
      if (value === undefined) {
        return null;
      }
      return value;
    },
    encode(value) {
      if (value === null) {
        return { value: undefined };
      }
      return { value };
    },
  },
);

export type Key = typeof Key.Type;

export const TransactionStatusFilter = Schema.transform(
  Schema.Enums(proto.filter.TransactionStatusFilter),
  Schema.Literal("succeeded", "reverted", "all", "unknown"),
  {
    decode(value) {
      const enumMap = {
        [proto.filter.TransactionStatusFilter.SUCCEEDED]: "succeeded",
        [proto.filter.TransactionStatusFilter.REVERTED]: "reverted",
        [proto.filter.TransactionStatusFilter.ALL]: "all",
        [proto.filter.TransactionStatusFilter.UNSPECIFIED]: "unknown",
        [proto.filter.TransactionStatusFilter.UNRECOGNIZED]: "unknown",
      } as const;
      return enumMap[value] ?? "unknown";
    },
    encode(value) {
      switch (value) {
        case "succeeded":
          return proto.filter.TransactionStatusFilter.SUCCEEDED;
        case "reverted":
          return proto.filter.TransactionStatusFilter.REVERTED;
        case "all":
          return proto.filter.TransactionStatusFilter.ALL;
        default:
          return proto.filter.TransactionStatusFilter.UNSPECIFIED;
      }
    },
  },
);

export type TransactionStatusFilter = typeof TransactionStatusFilter.Type;

/** Filter events.
 *
 * @prop address Filter events by the sender address.
 * @prop keys Filter events by the event keys. Use `null` to match any key.
 * @prop strict If `true`, then the filter will only match events that have exactly the
 * same number of keys as specified in `keys`.
 * @prop transactionStatus Filter based on the transaction status.
 * @prop includeTransaction Include the transaction that emitted the event.
 * @prop includeReceipt Include the transaction receipt.
 * @prop includeMessages Include the messages that were sent to L1 in the same transaction.
 * @prop includeSiblings Include the sibling events of the matched events.
 * @prop includeTransactionTrace Include the trace of the transaction that emitted the event.
 */
export const EventFilter = Schema.Struct({
  id: Schema.optional(Schema.Number),
  address: Schema.optional(FieldElement),
  keys: Schema.optional(Schema.Array(Key)),
  strict: Schema.optional(Schema.Boolean),
  transactionStatus: Schema.optional(TransactionStatusFilter),
  includeTransaction: Schema.optional(Schema.Boolean),
  includeReceipt: Schema.optional(Schema.Boolean),
  includeMessages: Schema.optional(Schema.Boolean),
  includeSiblings: Schema.optional(Schema.Boolean),
  includeTransactionTrace: Schema.optional(Schema.Boolean),
});

export type EventFilter = typeof EventFilter.Type;

/** Filter messages to L1.
 *
 * @prop fromAddress Filter messages by the sender address (on L2).
 * @prop toAddress Filter messages by the recipient address (on L1).
 * @prop transactionStatus Filter based on the transaction status.
 * @prop includeTransaction Include the transaction that sent the message.
 * @prop includeReceipt Include the transaction receipt.
 * @prop includeEvents Include events from the same transaction.
 * @prop includeTransactionTrace Include the trace of the transaction that sent the message.
 */
export const MessageToL1Filter = Schema.Struct({
  id: Schema.optional(Schema.Number),
  fromAddress: Schema.optional(FieldElement),
  toAddress: Schema.optional(FieldElement),
  transactionStatus: Schema.optional(TransactionStatusFilter),
  includeTransaction: Schema.optional(Schema.Boolean),
  includeReceipt: Schema.optional(Schema.Boolean),
  includeEvents: Schema.optional(Schema.Boolean),
  includeTransactionTrace: Schema.optional(Schema.Boolean),
});

export type MessageToL1Filter = typeof MessageToL1Filter.Type;

export const InvokeTransactionV0Filter = Schema.Struct({
  _tag: tag("invokeV0"),
  invokeV0: Schema.Struct({}),
});

export type InvokeTransactionV0Filter = typeof InvokeTransactionV0Filter.Type;

export const InvokeTransactionV1Filter = Schema.Struct({
  _tag: tag("invokeV1"),
  invokeV1: Schema.Struct({}),
});

export type InvokeTransactionV1Filter = typeof InvokeTransactionV1Filter.Type;

export const InvokeTransactionV3Filter = Schema.Struct({
  _tag: tag("invokeV3"),
  invokeV3: Schema.Struct({}),
});

export type InvokeTransactionV3Filter = typeof InvokeTransactionV3Filter.Type;

export const DeployTransactionFilter = Schema.Struct({
  _tag: tag("deploy"),
  deploy: Schema.Struct({}),
});

export type DeployTransactionFilter = typeof DeployTransactionFilter.Type;

export const DeclareV0TransactionFilter = Schema.Struct({
  _tag: tag("declareV0"),
  declareV0: Schema.Struct({}),
});

export type DeclareV0TransactionFilter = typeof DeclareV0TransactionFilter.Type;

export const DeclareV1TransactionFilter = Schema.Struct({
  _tag: tag("declareV1"),
  declareV1: Schema.Struct({}),
});

export type DeclareV1TransactionFilter = typeof DeclareV1TransactionFilter.Type;

export const DeclareV2TransactionFilter = Schema.Struct({
  _tag: tag("declareV2"),
  declareV2: Schema.Struct({}),
});

export type DeclareV2TransactionFilter = typeof DeclareV2TransactionFilter.Type;

export const DeclareV3TransactionFilter = Schema.Struct({
  _tag: tag("declareV3"),
  declareV3: Schema.Struct({}),
});

export type DeclareV3TransactionFilter = typeof DeclareV3TransactionFilter.Type;

export const L1HandlerTransactionFilter = Schema.Struct({
  _tag: tag("l1Handler"),
  l1Handler: Schema.Struct({}),
});

export type L1HandlerTransactionFilter = typeof L1HandlerTransactionFilter.Type;

export const DeployAccountV1TransactionFilter = Schema.Struct({
  _tag: tag("deployAccountV1"),
  deployAccountV1: Schema.Struct({}),
});

export type DeployAccountV1TransactionFilter =
  typeof DeployAccountV1TransactionFilter.Type;

export const DeployAccountV3TransactionFilter = Schema.Struct({
  _tag: tag("deployAccountV3"),
  deployAccountV3: Schema.Struct({}),
});

export type DeployAccountV3TransactionFilter =
  typeof DeployAccountV3TransactionFilter.Type;

/** Filter transactions.
 *
 * @prop transactionStatus Filter based on the transaction status.
 * @prop includeReceipt Include the transaction receipt.
 * @prop includeEvents Include events from the same transaction.
 * @prop includeMessages Include messages sent in the transaction.
 * @prop includeTrace Include the transaction's trace.
 */
export const TransactionFilter = Schema.Struct({
  id: Schema.optional(Schema.Number),
  transactionStatus: Schema.optional(TransactionStatusFilter),
  includeReceipt: Schema.optional(Schema.Boolean),
  includeMessages: Schema.optional(Schema.Boolean),
  includeEvents: Schema.optional(Schema.Boolean),
  includeTrace: Schema.optional(Schema.Boolean),
  transactionType: Schema.optional(
    Schema.Union(
      InvokeTransactionV0Filter,
      InvokeTransactionV1Filter,
      InvokeTransactionV3Filter,
      DeployTransactionFilter,
      DeclareV0TransactionFilter,
      DeclareV1TransactionFilter,
      DeclareV2TransactionFilter,
      DeclareV3TransactionFilter,
      DeclareV3TransactionFilter,
      L1HandlerTransactionFilter,
      DeployAccountV1TransactionFilter,
      DeployAccountV3TransactionFilter,
    ),
  ),
});

export type TransactionFilter = typeof TransactionFilter.Type;

/** Filter storage diffs.
 *
 *  @prop contractAddress Filter by contract address.
 */
export const StorageDiffFilter = Schema.Struct({
  id: Schema.optional(Schema.Number),
  contractAddress: Schema.optional(FieldElement),
});

export type StorageDiffFilter = typeof StorageDiffFilter.Type;

/** Filter declared classes. */
export const DeclaredClassFilter = Schema.Struct({
  _tag: tag("declaredClass"),
  declaredClass: Schema.Struct({}),
});

export type DeclaredClassFilter = typeof DeclaredClassFilter.Type;

export const ReplacedClassFilter = Schema.Struct({
  _tag: tag("replacedClass"),
  replacedClass: Schema.Struct({}),
});

export type ReplacedClassFilter = typeof ReplacedClassFilter.Type;

export const DeployedContractFilter = Schema.Struct({
  _tag: tag("deployedContract"),
  deployedContract: Schema.Struct({}),
});

export type DeployedContractFilter = typeof DeployedContractFilter.Type;

/** Filter contract changes. */
export const ContractChangeFilter = Schema.Struct({
  id: Schema.optional(Schema.Number),
  change: Schema.optional(
    Schema.Union(
      DeclaredClassFilter,
      ReplacedClassFilter,
      DeployedContractFilter,
    ),
  ),
});

export type ContractChangeFilter = typeof ContractChangeFilter.Type;

/** Filter updates to nonces.
 *
 * @prop contractAddress Filter by contract address.
 */
export const NonceUpdateFilter = Schema.Struct({
  id: Schema.optional(Schema.Number),
  contractAddress: Schema.optional(FieldElement),
});

export type NonceUpdateFilter = typeof NonceUpdateFilter.Type;

export const Filter = Schema.Struct({
  header: Schema.optional(HeaderFilter),
  transactions: Schema.optional(Schema.Array(TransactionFilter)),
  events: Schema.optional(Schema.Array(EventFilter)),
  messages: Schema.optional(Schema.Array(MessageToL1Filter)),
  storageDiffs: Schema.optional(Schema.Array(StorageDiffFilter)),
  contractChanges: Schema.optional(Schema.Array(ContractChangeFilter)),
  nonceUpdates: Schema.optional(Schema.Array(NonceUpdateFilter)),
});

export type Filter = typeof Filter.Type;

export const filterToProto = Schema.encodeSync(Filter);
export const filterFromProto = Schema.decodeSync(Filter);

export const FilterFromBytes = Schema.transform(
  Schema.Uint8ArrayFromSelf,
  Filter,
  {
    strict: false,
    decode(value) {
      return proto.filter.Filter.decode(value);
    },
    encode(value) {
      return proto.filter.Filter.encode(value).finish();
    },
  },
);

export const filterToBytes = Schema.encodeSync(FilterFromBytes);
export const filterFromBytes = Schema.decodeSync(FilterFromBytes);

export function mergeFilter(a: Filter, b: Filter): Filter {
  const header = mergeHeaderFilter(a.header, b.header);
  return {
    header,
    transactions: [...(a.transactions ?? []), ...(b.transactions ?? [])],
    events: [...(a.events ?? []), ...(b.events ?? [])],
    messages: [...(a.messages ?? []), ...(b.messages ?? [])],
    storageDiffs: [...(a.storageDiffs ?? []), ...(b.storageDiffs ?? [])],
    contractChanges: [
      ...(a.contractChanges ?? []),
      ...(b.contractChanges ?? []),
    ],
    nonceUpdates: [...(a.nonceUpdates ?? []), ...(b.nonceUpdates ?? [])],
  };
}

function mergeHeaderFilter(
  a?: HeaderFilter,
  b?: HeaderFilter,
): HeaderFilter | undefined {
  if (a === undefined) {
    return b;
  }
  if (b === undefined) {
    return a;
  }

  if (a === "always" || b === "always") {
    return "always";
  }

  if (a === "on_data_or_on_new_block" || b === "on_data_or_on_new_block") {
    return "on_data_or_on_new_block";
  }

  return "on_data";
}
