import { Option } from "effect";
import { Schema, TreeFormatter } from "@effect/schema";
import { ParseOptions } from "@effect/schema/AST";

import { Address, B256, b256FromProto, b256ToProto } from "./common";

import * as proto from "./proto";

const OptionalArray = <TSchema extends Schema.Schema.Any>(schema: TSchema) =>
  Schema.optional(Schema.Array(schema));

export const HeaderFilter = Schema.Struct({
  always: Schema.optional(Schema.Boolean),
});

export type HeaderFilter = typeof HeaderFilter.Type;

export const WithdrawalFilter = Schema.Struct({
  validatorIndex: Schema.optional(Schema.BigIntFromSelf),
  address: Schema.optional(Address),
});

export type WithdrawalFilter = typeof WithdrawalFilter.Type;

// TODO: using the decoder inside decode/encode feels wrong.
export const Topic = Schema.transform(
  Schema.Struct({ value: Schema.UndefinedOr(B256) }),
  Schema.NullOr(B256),
  {
    strict: false,
    decode({ value }) {
      if (value === undefined) {
        return null;
      }
      return b256ToProto(value);
    },
    encode(value) {
      if (value === null) {
        return { value: undefined };
      }
      return { value: b256FromProto(value) };
    },
  },
);

export const LogFilter = Schema.Struct({
  address: Schema.optional(Address),
  topics: OptionalArray(Topic),

  strict: Schema.optional(Schema.Boolean),
  includeTransaction: Schema.optional(Schema.Boolean),
  includeReceipt: Schema.optional(Schema.Boolean),
});

export type LogFilter = typeof LogFilter.Type;

export const TransactionFilter = Schema.Struct({
  from: Schema.optional(Address),
  to: Schema.optional(Address),

  includeReceipt: Schema.optional(Schema.Boolean),
  includeLogs: Schema.optional(Schema.Boolean),
});

export type TransactionFilter = typeof TransactionFilter.Type;

export const Filter = Schema.Struct({
  header: Schema.optional(HeaderFilter),
  withdrawals: OptionalArray(WithdrawalFilter),
  logs: OptionalArray(LogFilter),
  transactions: OptionalArray(TransactionFilter),
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
