import { Schema } from "@effect/schema";

import { Cursor, CursorMessage } from "./common";
import * as proto from "./proto";

const DataFinalityEnum = Schema.Enums(proto.stream.DataFinality);

export const DataFinality = Schema.Literal(
  "finalized",
  "accepted",
  "pending",
  "unknown",
);

export const DataFinalityFromMessage = Schema.transform(
  DataFinalityEnum,
  DataFinality,
  {
    encode(value) {
      const enumMap = {
        ["finalized"]: proto.stream.DataFinality.FINALIZED,
        ["accepted"]: proto.stream.DataFinality.ACCEPTED,
        ["pending"]: proto.stream.DataFinality.PENDING,
        ["unknown"]: proto.stream.DataFinality.UNKNOWN,
      };

      return enumMap[value] ?? proto.stream.DataFinality.UNKNOWN;
    },
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
  },
);

export class StreamDataRequest extends Schema.Class<StreamDataRequest>(
  "StreamDataRequest",
)({
  finality: DataFinalityFromMessage,
  startingCursor: Schema.optional(Cursor),
  filter: Schema.Array(Schema.Uint8ArrayFromSelf),
}) {
  toProto() {
    return Schema.encodeSync(StreamDataRequest)(this);
  }

  static fromProto = Schema.decodeSync(StreamDataRequest);
}

export const Invalidate = Schema.TaggedStruct("invalidate", {
  cursor: Schema.optional(Cursor),
});

export type Invalidate = typeof Invalidate.Type;

export const Data = Schema.TaggedStruct("data", {
  cursor: Schema.optional(Cursor),
  endCursor: Schema.optional(Cursor),
  finality: DataFinality,
  data: Schema.Array(Schema.Uint8ArrayFromSelf),
});

export type Data = typeof Data.Type;

export const Heartbeat = Schema.TaggedStruct("heartbeat", {});

export type Heartbeat = typeof Heartbeat.Type;

export const SystemMessage = Schema.TaggedStruct("systemMessage", {});

export type SystemMessage = typeof SystemMessage.Type;

export const StreamDataResponse = Schema.Union(
  Invalidate,
  Data,
  Heartbeat,
  SystemMessage,
);

export type StreamDataResponse = typeof StreamDataResponse.Type;

const DataMessage = Schema.Struct({
  $case: Schema.tag("data"),
  data: Schema.Struct({
    cursor: Schema.optional(CursorMessage),
    endCursor: Schema.optional(CursorMessage),
    finality: DataFinalityFromMessage,
    data: Schema.Array(Schema.Uint8ArrayFromSelf),
  }),
});

const InvalidateMessage = Schema.Struct({
  $case: Schema.tag("invalidate"),
  invalidate: Schema.Struct({
    cursor: Schema.optional(CursorMessage),
  }),
});

const HeartbeatMessage = Schema.Struct({
  $case: Schema.tag("heartbeat"),
});

const SystemMessageMessage = Schema.Struct({
  $case: Schema.tag("systemMessage"),
});

const StreamDataResponseMessage = Schema.Struct({
  message: Schema.optional(
    Schema.Union(
      DataMessage,
      InvalidateMessage,
      HeartbeatMessage,
      SystemMessageMessage,
    ),
  ),
});

export const StreamDataResponseFromMessage = Schema.transform(
  StreamDataResponseMessage,
  StreamDataResponse,
  {
    strict: false,
    encode(value) {
      throw new Error("not implemented");
    },
    decode(value) {
      switch (value.message?.$case) {
        case "data": {
          return {
            _tag: "data",
            ...value.message.data,
          };
        }
        case "invalidate": {
          return {
            _tag: "invalidate",
            ...value.message.invalidate,
          };
        }
        case "heartbeat": {
          return Heartbeat.make({});
        }
        case "systemMessage": {
          console.log(value.message);
        }
        default: {
          throw new Error(`unrecognized message ${value.message?.$case}`);
        }
      }
    },
  },
);
