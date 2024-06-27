import { Schema } from "@effect/schema";
import { StreamConfig } from "../config";
import * as proto from "../proto";

export const MockFilter = Schema.transform(
  Schema.Uint8ArrayFromSelf,
  Schema.Struct({}),
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

export type MockFilter = typeof MockFilter.Type;

export const MockBlock = Schema.transform(
  Schema.Uint8ArrayFromSelf,
  Schema.Struct({
    blockNumber: Schema.BigIntFromSelf,
  }),
  {
    decode(value) {
      return proto.testing.MockBlock.decode(value);
    },
    encode(value) {
      return proto.testing.MockFilter.encode(value).finish();
    },
  },
);

export type MockBlock = typeof MockBlock.Type;

export const MockStream = new StreamConfig(MockFilter, MockBlock);
