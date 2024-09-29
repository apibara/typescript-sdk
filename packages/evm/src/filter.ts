import { Schema } from "@effect/schema";

import { Address, B256, B256Proto } from "./common";

import * as proto from "./proto";

const OptionalArray = <TSchema extends Schema.Schema.Any>(schema: TSchema) =>
  Schema.optional(Schema.Array(schema));

export const HeaderFilter = Schema.Struct({
  always: Schema.optional(Schema.Boolean),
});

export type HeaderFilter = typeof HeaderFilter.Type;

export const WithdrawalFilter = Schema.Struct({
  id: Schema.optional(Schema.Number),
  validatorIndex: Schema.optional(Schema.Number),
  address: Schema.optional(Address),
});

export type WithdrawalFilter = typeof WithdrawalFilter.Type;

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

export const Topic = Schema.transform(
  Schema.Struct({ value: Schema.UndefinedOr(B256Proto) }),
  Schema.NullOr(B256),
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

export const LogFilter = Schema.Struct({
  id: Schema.optional(Schema.Number),
  address: Schema.optional(Address),
  topics: OptionalArray(Topic),
  strict: Schema.optional(Schema.Boolean),
  transactionStatus: Schema.optional(TransactionStatusFilter),
  includeTransaction: Schema.optional(Schema.Boolean),
  includeReceipt: Schema.optional(Schema.Boolean),
});

export type LogFilter = typeof LogFilter.Type;

export const TransactionFilter = Schema.Struct({
  id: Schema.optional(Schema.Number),
  from: Schema.optional(Address),
  to: Schema.optional(Address),
  create: Schema.optional(Schema.Boolean),
  transactionStatus: Schema.optional(TransactionStatusFilter),
  includeReceipt: Schema.optional(Schema.Boolean),
  includeLogs: Schema.optional(Schema.Boolean),
});

export type TransactionFilter = typeof TransactionFilter.Type;

export const Filter = Schema.Struct({
  header: Schema.optional(HeaderFilter),
  withdrawals: OptionalArray(WithdrawalFilter),
  transactions: OptionalArray(TransactionFilter),
  logs: OptionalArray(LogFilter),
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
    withdrawals: [...(a.withdrawals ?? []), ...(b.withdrawals ?? [])],
    logs: [...(a.logs ?? []), ...(b.logs ?? [])],
    transactions: [...(a.transactions ?? []), ...(b.transactions ?? [])],
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
