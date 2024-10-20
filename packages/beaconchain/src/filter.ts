import { Schema } from "@effect/schema";

import { Address, ValidatorStatus } from "./common";
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

/** Filter transactions.
 *
 * @prop from Filter transactions by the sender address.
 * @prop to Filter transactions by the target address.
 * @prop includeBlob Include any blob posted by the transaction..
 */
export const TransactionFilter = Schema.Struct({
  id: Schema.optional(Schema.Number),
  from: Schema.optional(Address),
  to: Schema.optional(Address),
  create: Schema.optional(Schema.Boolean),
  includeBlob: Schema.optional(Schema.Boolean),
});

export type TransactionFilter = typeof TransactionFilter.Type;

/** Filter validators.
 *
 * @prop validatorIndex Filter validators by their index.
 * @prop status Filter validators by their status.
 */
export const ValidatorFilter = Schema.Struct({
  id: Schema.optional(Schema.Number),
  validatorIndex: Schema.optional(Schema.Number),
  status: Schema.optional(ValidatorStatus),
});

export type ValidatorFilter = typeof ValidatorFilter.Type;

/** Filter blobs.
 *
 * @prop includeTransaction Include the transaction that posted the blob.
 */
export const BlobFilter = Schema.Struct({
  id: Schema.optional(Schema.Number),
  includeTransaction: Schema.optional(Schema.Boolean),
});

export type BlobFilter = typeof BlobFilter.Type;

/** Filter block data.
 *
 * @prop header Change how block headers are returned.
 * @prop validators Filter validators.
 */
export const Filter = Schema.Struct({
  header: Schema.optional(HeaderFilter),
  transactions: Schema.optional(Schema.Array(TransactionFilter)),
  validators: Schema.optional(Schema.Array(ValidatorFilter)),
  blobs: Schema.optional(Schema.Array(BlobFilter)),
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
    validators: [...(a.validators ?? []), ...(b.validators ?? [])],
    blobs: [...(a.blobs ?? []), ...(b.blobs ?? [])],
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
