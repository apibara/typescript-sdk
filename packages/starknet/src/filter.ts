import {
  ArrayCodec,
  BooleanCodec,
  type Codec,
  type CodecType,
  MessageCodec,
  NumberCodec,
  OneOfCodec,
  OptionalCodec,
} from "@apibara/protocol/codec";
import { FieldElement } from "./common";
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

/** An event key filter. Use `null` to match any event key. */
export const Key: Codec<
  FieldElement | null,
  { value?: proto.common.FieldElement | undefined }
> = {
  encode(x) {
    if (x === null) {
      return { value: undefined };
    }
    return { value: FieldElement.encode(x) };
  },
  decode(p) {
    if (p.value === undefined) {
      return null;
    }
    return FieldElement.decode(p.value);
  },
};

export type Key = CodecType<typeof Key>;

export const TransactionStatusFilter: Codec<
  "succeeded" | "reverted" | "all" | "unknown",
  proto.filter.TransactionStatusFilter
> = {
  encode(x) {
    switch (x) {
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
  decode(p) {
    const enumMap = {
      [proto.filter.TransactionStatusFilter.SUCCEEDED]: "succeeded",
      [proto.filter.TransactionStatusFilter.REVERTED]: "reverted",
      [proto.filter.TransactionStatusFilter.ALL]: "all",
      [proto.filter.TransactionStatusFilter.UNSPECIFIED]: "unknown",
      [proto.filter.TransactionStatusFilter.UNRECOGNIZED]: "unknown",
    } as const;
    return enumMap[p] ?? "unknown";
  },
};

export type TransactionStatusFilter = CodecType<typeof TransactionStatusFilter>;

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
 * @prop includeTransactionTrace Include the trace of the transaction that emitted the event.
 */
export const EventFilter = MessageCodec({
  id: OptionalCodec(NumberCodec),
  address: OptionalCodec(FieldElement),
  keys: OptionalCodec(ArrayCodec(Key)),
  strict: OptionalCodec(BooleanCodec),
  transactionStatus: OptionalCodec(TransactionStatusFilter),
  includeTransaction: OptionalCodec(BooleanCodec),
  includeReceipt: OptionalCodec(BooleanCodec),
  includeMessages: OptionalCodec(BooleanCodec),
  includeSiblings: OptionalCodec(BooleanCodec),
  includeTransactionTrace: OptionalCodec(BooleanCodec),
});

export type EventFilter = Readonly<CodecType<typeof EventFilter>>;

/** Filter messages to L1.
 *
 * @prop fromAddress Filter messages by the sender address (on L2).
 * @prop toAddress Filter messages by the recipient address (on L1).
 * @prop transactionStatus Filter based on the transaction status.
 * @prop includeTransaction Include the transaction that sent the message.
 * @prop includeReceipt Include the transaction receipt.
 * @prop includeEvents Include events from the same transaction.
 * @prop includeTransactionTrace Include the trace of the transaction that sent the message.
 */
export const MessageToL1Filter = MessageCodec({
  id: OptionalCodec(NumberCodec),
  fromAddress: OptionalCodec(FieldElement),
  toAddress: OptionalCodec(FieldElement),
  transactionStatus: OptionalCodec(TransactionStatusFilter),
  includeTransaction: OptionalCodec(BooleanCodec),
  includeReceipt: OptionalCodec(BooleanCodec),
  includeEvents: OptionalCodec(BooleanCodec),
  includeTransactionTrace: OptionalCodec(BooleanCodec),
});

export type MessageToL1Filter = Readonly<CodecType<typeof MessageToL1Filter>>;

// Transaction type filters
export const InvokeTransactionV0Filter = MessageCodec({});
export type InvokeTransactionV0Filter = Readonly<
  CodecType<typeof InvokeTransactionV0Filter>
>;

export const InvokeTransactionV1Filter = MessageCodec({});
export type InvokeTransactionV1Filter = Readonly<
  CodecType<typeof InvokeTransactionV1Filter>
>;

export const InvokeTransactionV3Filter = MessageCodec({});
export type InvokeTransactionV3Filter = Readonly<
  CodecType<typeof InvokeTransactionV3Filter>
>;

export const DeployTransactionFilter = MessageCodec({});
export type DeployTransactionFilter = Readonly<
  CodecType<typeof DeployTransactionFilter>
>;

export const DeclareV0TransactionFilter = MessageCodec({});
export type DeclareV0TransactionFilter = Readonly<
  CodecType<typeof DeclareV0TransactionFilter>
>;

export const DeclareV1TransactionFilter = MessageCodec({});
export type DeclareV1TransactionFilter = Readonly<
  CodecType<typeof DeclareV1TransactionFilter>
>;

export const DeclareV2TransactionFilter = MessageCodec({});
export type DeclareV2TransactionFilter = Readonly<
  CodecType<typeof DeclareV2TransactionFilter>
>;

export const DeclareV3TransactionFilter = MessageCodec({});
export type DeclareV3TransactionFilter = Readonly<
  CodecType<typeof DeclareV3TransactionFilter>
>;

export const L1HandlerTransactionFilter = MessageCodec({});
export type L1HandlerTransactionFilter = Readonly<
  CodecType<typeof L1HandlerTransactionFilter>
>;

export const DeployAccountV1TransactionFilter = MessageCodec({});
export type DeployAccountV1TransactionFilter = Readonly<
  CodecType<typeof DeployAccountV1TransactionFilter>
>;

export const DeployAccountV3TransactionFilter = MessageCodec({});
export type DeployAccountV3TransactionFilter = Readonly<
  CodecType<typeof DeployAccountV3TransactionFilter>
>;

/** Filter transactions.
 *
 * @prop transactionStatus Filter based on the transaction status.
 * @prop includeReceipt Include the transaction receipt.
 * @prop includeEvents Include events from the same transaction.
 * @prop includeMessages Include messages sent in the transaction.
 * @prop includeTrace Include the transaction's trace.
 */
export const TransactionFilter = MessageCodec({
  id: OptionalCodec(NumberCodec),
  transactionStatus: OptionalCodec(TransactionStatusFilter),
  includeReceipt: OptionalCodec(BooleanCodec),
  includeMessages: OptionalCodec(BooleanCodec),
  includeEvents: OptionalCodec(BooleanCodec),
  includeTrace: OptionalCodec(BooleanCodec),
  transactionType: OptionalCodec(
    OneOfCodec({
      invokeV0: InvokeTransactionV0Filter,
      invokeV1: InvokeTransactionV1Filter,
      invokeV3: InvokeTransactionV3Filter,
      deploy: DeployTransactionFilter,
      declareV0: DeclareV0TransactionFilter,
      declareV1: DeclareV1TransactionFilter,
      declareV2: DeclareV2TransactionFilter,
      declareV3: DeclareV3TransactionFilter,
      l1Handler: L1HandlerTransactionFilter,
      deployAccountV1: DeployAccountV1TransactionFilter,
      deployAccountV3: DeployAccountV3TransactionFilter,
    }),
  ),
});

export type TransactionFilter = Readonly<CodecType<typeof TransactionFilter>>;

/** Filter storage diffs.
 *
 *  @prop contractAddress Filter by contract address.
 */
export const StorageDiffFilter = MessageCodec({
  id: OptionalCodec(NumberCodec),
  contractAddress: OptionalCodec(FieldElement),
});

export type StorageDiffFilter = Readonly<CodecType<typeof StorageDiffFilter>>;

/** Filter declared classes. */
export const DeclaredClassFilter = MessageCodec({});
export type DeclaredClassFilter = Readonly<
  CodecType<typeof DeclaredClassFilter>
>;

export const ReplacedClassFilter = MessageCodec({});
export type ReplacedClassFilter = Readonly<
  CodecType<typeof ReplacedClassFilter>
>;

export const DeployedContractFilter = MessageCodec({});
export type DeployedContractFilter = Readonly<
  CodecType<typeof DeployedContractFilter>
>;

/** Filter contract changes. */
export const ContractChangeFilter = MessageCodec({
  id: OptionalCodec(NumberCodec),
  change: OptionalCodec(
    OneOfCodec({
      declaredClass: DeclaredClassFilter,
      replacedClass: ReplacedClassFilter,
      deployedContract: DeployedContractFilter,
    }),
  ),
});

export type ContractChangeFilter = Readonly<
  CodecType<typeof ContractChangeFilter>
>;

/** Filter updates to nonces.
 *
 * @prop contractAddress Filter by contract address.
 */
export const NonceUpdateFilter = MessageCodec({
  id: OptionalCodec(NumberCodec),
  contractAddress: OptionalCodec(FieldElement),
});

export type NonceUpdateFilter = Readonly<CodecType<typeof NonceUpdateFilter>>;

export const Filter = MessageCodec({
  header: OptionalCodec(HeaderFilter),
  transactions: OptionalCodec(ArrayCodec(TransactionFilter)),
  events: OptionalCodec(ArrayCodec(EventFilter)),
  messages: OptionalCodec(ArrayCodec(MessageToL1Filter)),
  storageDiffs: OptionalCodec(ArrayCodec(StorageDiffFilter)),
  contractChanges: OptionalCodec(ArrayCodec(ContractChangeFilter)),
  nonceUpdates: OptionalCodec(ArrayCodec(NonceUpdateFilter)),
});

export type Filter = Readonly<CodecType<typeof Filter>>;

export function filterToProto(filter: Filter) {
  return Filter.encode(filter);
}

export function filterFromProto(protoFilter: ReturnType<typeof filterToProto>) {
  return Filter.decode(protoFilter);
}

export const FilterFromBytes: Codec<Filter, Uint8Array> = {
  encode(x) {
    const filter = Filter.encode(x);
    return proto.filter.Filter.encode(filter).finish();
  },
  decode(p) {
    const filter = proto.filter.Filter.decode(p);
    return Filter.decode(filter);
  },
};

export function filterToBytes(filter: Filter) {
  return FilterFromBytes.encode(filter);
}

export function filterFromBytes(bytes: Uint8Array) {
  return FilterFromBytes.decode(bytes);
}

export function mergeFilter(a: Filter, b: Filter): Filter {
  const header = mergeHeaderFilter(a.header, b.header);
  return {
    header,
    transactions: [...(a.transactions ?? []), ...(b.transactions ?? [])],
    events: [...(a.events ?? []), ...(b.events ?? [])],
    messages: [...(a.messages ?? []), ...(b.messages ?? [])],
    storageDiffs: [...(a.storageDiffs ?? []), ...(b.storageDiffs ?? [])],
    contractChanges: [
      ...(a.contractChanges ?? []),
      ...(b.contractChanges ?? []),
    ],
    nonceUpdates: [...(a.nonceUpdates ?? []), ...(b.nonceUpdates ?? [])],
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
