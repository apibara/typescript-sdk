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
        ["finalized"]: proto.stream.DataFinality.FINALIZED,
        ["accepted"]: proto.stream.DataFinality.ACCEPTED,
        ["pending"]: proto.stream.DataFinality.PENDING,
        ["unknown"]: proto.stream.DataFinality.UNKNOWN,
      };

      return enumMap[value] ?? proto.stream.DataFinality.UNKNOWN;
    },
  },
);

export type DataFinality = typeof DataFinality.Type;

export const StreamDataRequest = <TA, TR>(
  data: Schema.Schema<TA, Uint8Array, TR>,
) =>
  Schema.Struct({
    finality: Schema.optional(DataFinality),
    startingCursor: Schema.optional(Cursor),
    filter: Schema.Array(data),
  });

export const Invalidate = Schema.TaggedStruct("invalidate", {
  cursor: Schema.optional(Cursor),
});

export type Invalidate = typeof Invalidate.Type;

export const Data = <TA, TR>(schema: Schema.Schema<TA, Uint8Array, TR>) =>
  Schema.TaggedStruct("data", {
    cursor: Schema.optional(Cursor),
    endCursor: Schema.optional(Cursor),
    finality: DataFinality,
    data: Schema.Array(schema),
  });

export const StreamDataResponse = Schema.Union(Invalidate);
