import { Schema } from "@effect/schema";

import { Address, ValidatorStatus } from "./common";
import * as proto from "./proto";

/** Header options.
 *
 * Change `always` to `true` to receive headers even if no other data matches.
 */
export const HeaderFilter = Schema.Struct({
  always: Schema.optional(Schema.Boolean),
});

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
  return {
    always: a.always || b.always,
  };
}
