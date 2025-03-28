import {
  ArrayCodec,
  BigIntCodec,
  type Codec,
  type CodecType,
  MessageCodec,
  NumberCodec,
  OneOfCodec,
  OptionalCodec,
  StringCodec,
  UndefinedCodec,
} from "./codec";
import { Cursor } from "./common";
import * as proto from "./proto";

/** Data finality. */
export const DataFinality: Codec<
  "finalized" | "accepted" | "pending" | "unknown",
  proto.stream.DataFinality
> = {
  encode(x) {
    const enumMap = {
      finalized: proto.stream.DataFinality.FINALIZED,
      accepted: proto.stream.DataFinality.ACCEPTED,
      pending: proto.stream.DataFinality.PENDING,
      unknown: proto.stream.DataFinality.UNKNOWN,
    };

    return enumMap[x] ?? proto.stream.DataFinality.UNKNOWN;
  },
  decode(p) {
    const enumMap = {
      [proto.stream.DataFinality.FINALIZED]: "finalized",
      [proto.stream.DataFinality.ACCEPTED]: "accepted",
      [proto.stream.DataFinality.PENDING]: "pending",
      [proto.stream.DataFinality.UNKNOWN]: "unknown",
      [proto.stream.DataFinality.UNRECOGNIZED]: "unknown",
    } as const;

    return enumMap[p] ?? "unknown";
  },
};

export type DataFinality = CodecType<typeof DataFinality>;

/** Data production mode. */
export const DataProduction: Codec<
  "backfill" | "live" | "unknown",
  proto.stream.DataProduction
> = {
  encode(x) {
    switch (x) {
      case "backfill":
        return proto.stream.DataProduction.BACKFILL;
      case "live":
        return proto.stream.DataProduction.LIVE;
      case "unknown":
        return proto.stream.DataProduction.UNKNOWN;
      default:
        return proto.stream.DataProduction.UNRECOGNIZED;
    }
  },
  decode(p) {
    const enumMap = {
      [proto.stream.DataProduction.BACKFILL]: "backfill",
      [proto.stream.DataProduction.LIVE]: "live",
      [proto.stream.DataProduction.UNKNOWN]: "unknown",
      [proto.stream.DataProduction.UNRECOGNIZED]: "unknown",
    } as const;

    return enumMap[p] ?? "unknown";
  },
};

export type DataProduction = CodecType<typeof DataProduction>;

export const DurationCodec = MessageCodec({
  seconds: BigIntCodec,
  nanos: NumberCodec,
});

export type Duration = CodecType<typeof DurationCodec>;

/** Create a `StreamDataRequest` with the given filter schema. */
export const StreamDataRequest = <TA>(filter: Codec<TA, Uint8Array>) =>
  MessageCodec({
    finality: OptionalCodec(DataFinality),
    startingCursor: OptionalCodec(Cursor),
    filter: ArrayCodec(filter),
    heartbeatInterval: OptionalCodec(DurationCodec),
  });

export type StreamDataRequest<TA> = CodecType<
  ReturnType<typeof StreamDataRequest<TA>>
>;

export const Invalidate = MessageCodec({
  cursor: OptionalCodec(Cursor),
});

export type Invalidate = CodecType<typeof Invalidate>;

export const Finalize = MessageCodec({
  cursor: OptionalCodec(Cursor),
});

export type Finalize = CodecType<typeof Finalize>;

// TODO: Double check this; This is a hack to make the heartbeat variant undefined
export const Heartbeat = UndefinedCodec;

export type Heartbeat = CodecType<typeof Heartbeat>;

export const StdOut = StringCodec;

export type StdOut = CodecType<typeof StdOut>;

export const StdErr = StringCodec;

export type StdErr = CodecType<typeof StdErr>;

export const SystemMessage = MessageCodec({
  output: OneOfCodec({
    stdout: StdOut,
    stderr: StdErr,
  }),
});

export type SystemMessage = CodecType<typeof SystemMessage>;

const _DataOrNull = <TA>(
  schema: Codec<TA, Uint8Array>,
): Codec<TA | null, Uint8Array> => ({
  encode(x) {
    if (x === null) {
      return new Uint8Array();
    }
    return schema.encode(x);
  },
  decode(p) {
    if (p.length === 0) {
      return null;
    }
    return schema.decode(p);
  },
});

export const Data = <TA>(schema: Codec<TA | null, Uint8Array>) =>
  MessageCodec({
    cursor: OptionalCodec(Cursor),
    endCursor: Cursor,
    finality: DataFinality,
    production: DataProduction,
    data: ArrayCodec(_DataOrNull(schema)),
  });

export type Data<TA> = CodecType<ReturnType<typeof Data<TA>>>;

export const StreamDataResponse = <TA>(schema: Codec<TA | null, Uint8Array>) =>
  OneOfCodec({
    data: Data(schema),
    invalidate: Invalidate,
    finalize: Finalize,
    heartbeat: Heartbeat,
    systemMessage: SystemMessage,
  });

export const ResponseWithoutData = OneOfCodec({
  invalidate: Invalidate,
  finalize: Finalize,
  heartbeat: Heartbeat,
  systemMessage: SystemMessage,
});

export type ResponseWithoutData = CodecType<typeof ResponseWithoutData>;

export type StreamDataResponse<TA> = CodecType<
  ReturnType<typeof StreamDataResponse<TA>>
>;
