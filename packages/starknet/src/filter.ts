import { Schema } from "@effect/schema";

import { FieldElement, FieldElementProto } from "./common";
import { tag } from "./helpers";
import * as proto from "./proto";

/** Header options.
 *
 * Change `always` to `true` to receive headers even if no other data matches.
 */
export const HeaderFilter = Schema.Struct({
  always: Schema.optional(Schema.Boolean),
});

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
 */
export const MessageToL1Filter = Schema.Struct({
  id: Schema.optional(Schema.Number),
  fromAddress: Schema.optional(FieldElement),
  toAddress: Schema.optional(FieldElement),
  transactionStatus: Schema.optional(TransactionStatusFilter),
  includeTransaction: Schema.optional(Schema.Boolean),
  includeReceipt: Schema.optional(Schema.Boolean),
  includeEvents: Schema.optional(Schema.Boolean),
});

export type MessageToL1Filter = typeof MessageToL1Filter.Type;

export const InvokeTransactionV0Filter = Schema.Struct({
  _tag: tag("invokeV0"),
  invokeV0: Schema.Struct({}),
});

export const InvokeTransactionV1Filter = Schema.Struct({
  _tag: tag("invokeV1"),
  invokeV1: Schema.Struct({}),
});

export const InvokeTransactionV3Filter = Schema.Struct({
  _tag: tag("invokeV3"),
  invokeV3: Schema.Struct({}),
});

export const DeployTransactionFilter = Schema.Struct({
  _tag: tag("deploy"),
  deploy: Schema.Struct({}),
});

export const DeclareV0TransactionFilter = Schema.Struct({
  _tag: tag("declareV0"),
  declareV0: Schema.Struct({}),
});

export const DeclareV1TransactionFilter = Schema.Struct({
  _tag: tag("declareV1"),
  declareV1: Schema.Struct({}),
});

export const DeclareV2TransactionFilter = Schema.Struct({
  _tag: tag("declareV2"),
  declareV2: Schema.Struct({}),
});

export const DeclareV3TransactionFilter = Schema.Struct({
  _tag: tag("declareV3"),
  declareV3: Schema.Struct({}),
});

export const L1HandlerTransactionFilter = Schema.Struct({
  _tag: tag("l1Handler"),
  l1Handler: Schema.Struct({}),
});

export const DeployAccountV1TransactionFilter = Schema.Struct({
  _tag: tag("deployAccountV1"),
  deployAccountV1: Schema.Struct({}),
});

export const DeployAccountV3TransactionFilter = Schema.Struct({
  _tag: tag("deployAccountV3"),
  deployAccountV3: Schema.Struct({}),
});

/** Filter transactions.
 *
 * @prop transactionStatus Filter based on the transaction status.
 * @prop includeReceipt Include the transaction receipt.
 * @prop includeEvents Include events from the same transaction.
 * @prop includeMessages Include messages sent in the transaction.
 */
export const TransactionFilter = Schema.Struct({
  id: Schema.optional(Schema.Number),
  transactionStatus: Schema.optional(TransactionStatusFilter),
  includeReceipt: Schema.optional(Schema.Boolean),
  includeMessages: Schema.optional(Schema.Boolean),
  includeEvents: Schema.optional(Schema.Boolean),
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

export const Filter = Schema.Struct({
  header: Schema.optional(HeaderFilter),
  transactions: Schema.optional(Schema.Array(TransactionFilter)),
  events: Schema.optional(Schema.Array(EventFilter)),
  messages: Schema.optional(Schema.Array(MessageToL1Filter)),
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
  return {
    always: a.always || b.always,
  };
}
