import { Schema, TreeFormatter } from "@effect/schema";
import { ParseOptions } from "@effect/schema/AST";

import { AddressFromMessage, B256FromMessage } from "./common";

import * as proto from "./proto";

export const HeaderFilter = Schema.Struct({
  always: Schema.optional(Schema.Boolean),
});

export type HeaderFilter = typeof HeaderFilter.Type;

export const Topic = Schema.Struct({
  value: Schema.UndefinedOr(B256FromMessage),
});

const encodeTopic = Schema.encodeSync(B256FromMessage);
const decodeTopic = Schema.decodeSync(B256FromMessage);

export const TopicFromMessage = Schema.transform(
  Topic,
  Schema.NullOr(B256FromMessage),
  {
    encode(value) {
      if (value === null) {
        return { value: undefined };
      }
      return { value: decodeTopic(value) };
    },
    decode(value) {
      if (value.value === undefined) {
        return null;
      }
      return encodeTopic(value.value);
    },
  },
);

export const LogFilter = Schema.Struct({
  address: Schema.optional(AddressFromMessage),
  topics: Schema.Array(TopicFromMessage),

  strict: Schema.optional(Schema.Boolean),
  includeTransaction: Schema.optional(Schema.Boolean),
  includeReceipt: Schema.optional(Schema.Boolean),
});

export type LogFilter = typeof LogFilter.Type;

export const WithdrawalFilter = Schema.Struct({
  validatorIndex: Schema.optional(Schema.BigIntFromSelf),
  address: Schema.optional(AddressFromMessage),
});

export type WithdrawalFilter = typeof WithdrawalFilter.Type;

export const TransactionFilter = Schema.Struct({
  from: Schema.optional(AddressFromMessage),
  to: Schema.optional(AddressFromMessage),

  includeReceipt: Schema.optional(Schema.Boolean),
  includeLogs: Schema.optional(Schema.Boolean),
});

export type TransactionFilter = typeof TransactionFilter.Type;

export class Filter extends Schema.Class<Filter>("Filter")({
  header: Schema.optional(HeaderFilter),
  logs: Schema.Array(LogFilter),
  withdrawals: Schema.Array(WithdrawalFilter),
  transactions: Schema.Array(TransactionFilter),
}) {
  toProto(options?: ParseOptions) {
    return Schema.encodeSync(Filter)(this, options);
  }

  encode() {
    return proto.filter.Filter.encode(this.toProto()).finish();
  }

  static fromProto = Schema.decodeSync(Filter);
}
