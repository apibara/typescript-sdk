import { Schema } from "@effect/schema";

import { Cursor } from "./common";
import * as proto from "./proto";

/** Data finality. */
export const DataFinality = Schema.transform(
  Schema.Enums(proto.stream.DataFinality),
  Schema.Literal("finalized", "accepted", "pending", "unknown"),
  {
    decode(value) {
      const enumMap = {
        [proto.stream.DataFinality.FINALIZED]: "finalized",
        [proto.stream.DataFinality.ACCEPTED]: "accepted",
        [proto.stream.DataFinality.PENDING]: "pending",
        [proto.stream.DataFinality.UNKNOWN]: "unknown",
        [proto.stream.DataFinality.UNRECOGNIZED]: "unknown",
      } as const;

      return enumMap[value] ?? "unknown";
    },
    encode(value) {
      const enumMap = {
        finalized: proto.stream.DataFinality.FINALIZED,
        accepted: proto.stream.DataFinality.ACCEPTED,
        pending: proto.stream.DataFinality.PENDING,
        unknown: proto.stream.DataFinality.UNKNOWN,
      };

      return enumMap[value] ?? proto.stream.DataFinality.UNKNOWN;
    },
  },
);

export type DataFinality = typeof DataFinality.Type;

/** Create a `StreamDataRequest` with the given filter schema. */
export const StreamDataRequest = <TA, TR>(
  filter: Schema.Schema<TA, Uint8Array, TR>,
) =>
  Schema.Struct({
    finality: Schema.optional(DataFinality),
    startingCursor: Schema.optional(Cursor),
    filter: Schema.mutable(Schema.Array(filter)),
  });

export type StreamDataRequest<TA> = {
  finality?: DataFinality | undefined;
  startingCursor?: Cursor | undefined;
  filter: TA[];
};

export const Invalidate = Schema.Struct({
  _tag: tag("invalidate"),
  invalidate: Schema.Struct({
    cursor: Schema.optional(Cursor),
  }),
});

export type Invalidate = typeof Invalidate.Type;

export const Heartbeat = Schema.Struct({
  _tag: tag("heartbeat"),
});

export type Heartbeat = typeof Heartbeat.Type;

export const StdOut = Schema.Struct({
  _tag: tag("stdout"),
  stdout: Schema.String,
});

export type StdOut = typeof StdOut.Type;

export const StdErr = Schema.Struct({
  _tag: tag("stderr"),
  stderr: Schema.String,
});

export type StdErr = typeof StdErr.Type;

export const SystemMessage = Schema.Struct({
  _tag: tag("systemMessage"),
  systemMessage: Schema.Struct({
    output: Schema.optional(Schema.Union(StdOut, StdErr)),
  }),
});

export type SystemMessage = typeof SystemMessage.Type;

export const Data = <TA, TR>(
  schema: Schema.Schema<TA | null, Uint8Array, TR>,
) =>
  Schema.Struct({
    _tag: tag("data"),
    data: Schema.Struct({
      cursor: Schema.optional(Cursor),
      endCursor: Schema.optional(Cursor),
      finality: DataFinality,
      data: Schema.Array(schema),
    }),
  });

export const StreamDataResponse = <TA, TR>(
  data: Schema.Schema<TA | null, Uint8Array, TR>,
) => Schema.Union(Data(data), Invalidate, Heartbeat, SystemMessage);

const ResponseWithoutData = Schema.Union(Invalidate, Heartbeat, SystemMessage);
type ResponseWithoutData = typeof ResponseWithoutData.Type;

export type StreamDataResponse<TA> =
  | ResponseWithoutData
  | {
      _tag: "data";
      data: {
        cursor?: Cursor | undefined;
        endCursor?: Cursor | undefined;
        finality: DataFinality;
        data: readonly (TA | null)[];
      };
    };

function tag<T extends string>(tag: T) {
  return Schema.Literal(tag).pipe(
    Schema.propertySignature,
    Schema.fromKey("$case"),
  );
}
