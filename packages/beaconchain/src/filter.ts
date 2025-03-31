import {
  ArrayCodec,
  BooleanCodec,
  type Codec,
  type CodecType,
  MessageCodec,
  NumberCodec,
  OptionalCodec,
} from "@apibara/protocol/codec";
import { Address, ValidatorStatus } from "./common";
import * as proto from "./proto";

/** Header options.
 *
 * - `always`: receive all block headers.
 * - `on_data`: receive headers only if any other filter matches.
 * - `on_data_or_on_new_block`: receive headers only if any other filter matches and for "live" blocks.
 */
export const HeaderFilter: Codec<
  "always" | "on_data" | "on_data_or_on_new_block" | "unknown",
  proto.filter.HeaderFilter
> = {
  encode(x) {
    switch (x) {
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
  decode(p) {
    const enumMap = {
      [proto.filter.HeaderFilter.ALWAYS]: "always",
      [proto.filter.HeaderFilter.ON_DATA]: "on_data",
      [proto.filter.HeaderFilter.ON_DATA_OR_ON_NEW_BLOCK]:
        "on_data_or_on_new_block",
      [proto.filter.HeaderFilter.UNSPECIFIED]: "unknown",
      [proto.filter.HeaderFilter.UNRECOGNIZED]: "unknown",
    } as const;
    return enumMap[p] ?? "unknown";
  },
};

export type HeaderFilter = CodecType<typeof HeaderFilter>;

/** Filter transactions.
 *
 * @prop from Filter transactions by the sender address.
 * @prop to Filter transactions by the target address.
 * @prop includeBlob Include any blob posted by the transaction..
 */
export const TransactionFilter = MessageCodec({
  id: OptionalCodec(NumberCodec),
  from: OptionalCodec(Address),
  to: OptionalCodec(Address),
  create: OptionalCodec(BooleanCodec),
  includeBlob: OptionalCodec(BooleanCodec),
});

export type TransactionFilter = CodecType<typeof TransactionFilter>;

/** Filter validators.
 *
 * @prop validatorIndex Filter validators by their index.
 * @prop status Filter validators by their status.
 */
export const ValidatorFilter = MessageCodec({
  id: OptionalCodec(NumberCodec),
  validatorIndex: OptionalCodec(NumberCodec),
  status: OptionalCodec(ValidatorStatus),
});

export type ValidatorFilter = CodecType<typeof ValidatorFilter>;

/** Filter blobs.
 *
 * @prop includeTransaction Include the transaction that posted the blob.
 */
export const BlobFilter = MessageCodec({
  id: OptionalCodec(NumberCodec),
  includeTransaction: OptionalCodec(BooleanCodec),
});

export type BlobFilter = CodecType<typeof BlobFilter>;

/** Filter block data.
 *
 * @prop header Change how block headers are returned.
 * @prop validators Filter validators.
 */
export const Filter = MessageCodec({
  header: OptionalCodec(HeaderFilter),
  transactions: OptionalCodec(ArrayCodec(TransactionFilter)),
  validators: OptionalCodec(ArrayCodec(ValidatorFilter)),
  blobs: OptionalCodec(ArrayCodec(BlobFilter)),
});

export type Filter = CodecType<typeof Filter>;

export const filterToProto = Filter.encode;
export const filterFromProto = Filter.decode;

export const FilterFromBytes: Codec<Filter, Uint8Array> = {
  encode(value) {
    const filter = Filter.encode(value);
    return proto.filter.Filter.encode(filter).finish();
  },
  decode(value) {
    const filter = proto.filter.Filter.decode(value);
    return Filter.decode(filter);
  },
};

export const filterToBytes = FilterFromBytes.encode;
export const filterFromBytes = FilterFromBytes.decode;

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
