import { Schema } from "@effect/schema";
import { StreamConfig } from "../config";
import * as proto from "../proto";
import { StreamDataResponse } from "../stream";

export const MockFilter = Schema.Struct({
  filter: Schema.optional(Schema.String),
});

export type MockFilter = typeof MockFilter.Type;

export const MockFilterFromBytes = Schema.transform(
  Schema.Uint8ArrayFromSelf,
  MockFilter,
  {
    strict: false,
    decode(value) {
      return proto.testing.MockFilter.decode(value);
    },
    encode(value) {
      return proto.testing.MockFilter.encode(value).finish();
    },
  },
);

const MockBlock = Schema.Struct({
  data: Schema.optional(Schema.String),
});

export type MockBlock = typeof MockBlock.Type;

export const MockBlockFromBytes = Schema.transform(
  Schema.Uint8ArrayFromSelf,
  Schema.NullOr(MockBlock),
  {
    strict: false,
    decode(value) {
      if (value.length === 0) {
        return null;
      }
      return proto.testing.MockBlock.decode(value);
    },
    encode(value) {
      if (value === null) {
        return new Uint8Array();
      }
      return proto.testing.MockBlock.encode(value).finish();
    },
  },
);

export const MockStream = new StreamConfig(
  MockFilterFromBytes,
  MockBlockFromBytes,
);

export const MockStreamResponse = StreamDataResponse(MockBlockFromBytes);
export type MockStreamResponse = typeof MockStreamResponse.Type;
