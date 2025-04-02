import { Address, B256 } from "./common";

import {
  ArrayCodec,
  BooleanCodec,
  type Codec,
  type CodecType,
  MessageCodec,
  NumberCodec,
  OptionalCodec,
} from "@apibara/protocol/codec";
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

export const WithdrawalFilter = MessageCodec({
  id: OptionalCodec(NumberCodec),
  validatorIndex: OptionalCodec(NumberCodec),
  address: OptionalCodec(Address),
});

export type WithdrawalFilter = CodecType<typeof WithdrawalFilter>;

export const TransactionStatusFilter: Codec<
  "succeeded" | "reverted" | "all" | "unknown",
  proto.filter.TransactionStatusFilter
> = {
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
};

export type TransactionStatusFilter = CodecType<typeof TransactionStatusFilter>;

export const Topic: Codec<
  B256 | null,
  { value?: proto.common.B256 | undefined }
> = {
  encode(x) {
    if (x === null) {
      return { value: undefined };
    }
    return { value: B256.encode(x) };
  },
  decode({ value }) {
    if (value === undefined) {
      return null;
    }
    return B256.decode(value);
  },
};

export type Topic = CodecType<typeof Topic>;

export const LogFilter = MessageCodec({
  id: OptionalCodec(NumberCodec),
  address: OptionalCodec(Address),
  topics: OptionalCodec(ArrayCodec(Topic)),
  strict: OptionalCodec(BooleanCodec),
  transactionStatus: OptionalCodec(TransactionStatusFilter),
  includeTransaction: OptionalCodec(BooleanCodec),
  includeReceipt: OptionalCodec(BooleanCodec),
  includeTransactionTrace: OptionalCodec(BooleanCodec),
});

export type LogFilter = Readonly<CodecType<typeof LogFilter>>;

export const TransactionFilter = MessageCodec({
  id: OptionalCodec(NumberCodec),
  from: OptionalCodec(Address),
  to: OptionalCodec(Address),
  create: OptionalCodec(BooleanCodec),
  transactionStatus: OptionalCodec(TransactionStatusFilter),
  includeReceipt: OptionalCodec(BooleanCodec),
  includeLogs: OptionalCodec(BooleanCodec),
  includeTransactionTrace: OptionalCodec(BooleanCodec),
});

export type TransactionFilter = Readonly<CodecType<typeof TransactionFilter>>;

export const Filter = MessageCodec({
  header: OptionalCodec(HeaderFilter),
  withdrawals: OptionalCodec(ArrayCodec(WithdrawalFilter)),
  transactions: OptionalCodec(ArrayCodec(TransactionFilter)),
  logs: OptionalCodec(ArrayCodec(LogFilter)),
});

export type Filter = Readonly<CodecType<typeof Filter>>;

export const FilterFromBytes: Codec<Filter, Uint8Array> = {
  encode(x) {
    return proto.filter.Filter.encode(Filter.encode(x)).finish();
  },
  decode(p) {
    return Filter.decode(proto.filter.Filter.decode(p));
  },
};

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

  if (a === "always" || b === "always") {
    return "always";
  }

  if (a === "on_data_or_on_new_block" || b === "on_data_or_on_new_block") {
    return "on_data_or_on_new_block";
  }

  return "on_data";
}
