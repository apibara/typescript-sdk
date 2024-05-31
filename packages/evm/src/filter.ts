import { Schema } from "@effect/schema";
import { AddressFromMessage, B256FromMessage } from "./common";
import { ParseOptions } from "@effect/schema/AST";

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
  topics: Schema.optional(Schema.Array(TopicFromMessage)),

  strict: Schema.optional(Schema.Boolean),
  includeTransaction: Schema.optional(Schema.Boolean),
  includeReceipt: Schema.optional(Schema.Boolean),
});

export type LogFilter = typeof LogFilter.Type;

export class Filter extends Schema.Class<Filter>("Filter")({
  header: Schema.optional(HeaderFilter),
  logs: Schema.Array(LogFilter),
}) {
  toProto(options?: ParseOptions) {
    return Schema.encodeSync(Filter)(this, options);
  }

  static fromProto = Schema.decodeSync(Filter);
}
