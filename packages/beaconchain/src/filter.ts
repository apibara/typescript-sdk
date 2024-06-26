import { Schema } from "@effect/schema";

import * as proto from "./proto";
import { ValidatorStatus } from "./common";

/** Header options.
 *
 * Change `always` to `true` to receive headers even if no other data matches.
 */
export const HeaderFilter = Schema.Struct({
  always: Schema.optional(Schema.Boolean),
});

export type HeaderFilter = typeof HeaderFilter.Type;

export const ValidatorFilter = Schema.Struct({
  validatorIndex: Schema.optional(Schema.Number),
  status: Schema.optional(ValidatorStatus),
});

export type ValidatorFilter = typeof ValidatorFilter.Type;

export const Filter = Schema.Struct({
  header: Schema.optional(HeaderFilter),
  validators: Schema.optional(Schema.Array(ValidatorFilter)),
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
