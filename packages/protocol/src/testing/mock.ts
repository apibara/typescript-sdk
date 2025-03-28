import {
  type Codec,
  type CodecType,
  MessageCodec,
  OptionalCodec,
  StringCodec,
} from "../codec";
import { StreamConfig } from "../config";
import * as proto from "../proto";
import { StreamDataResponse } from "../stream";

export const MockFilter = MessageCodec({
  filter: OptionalCodec(StringCodec),
});

export type MockFilter = CodecType<typeof MockFilter>;

export const MockFilterFromBytes: Codec<MockFilter, Uint8Array> = {
  decode(value) {
    return proto.testing.MockFilter.decode(value);
  },
  encode(value) {
    return proto.testing.MockFilter.encode(value).finish();
  },
};

const MockBlock = MessageCodec({
  data: OptionalCodec(StringCodec),
});

export type MockBlock = CodecType<typeof MockBlock>;

export const MockBlockFromBytes: Codec<MockBlock | null, Uint8Array> = {
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
};

/** For testing, simply concatenate the values of `.filter` */
function mergeMockFilter(a: MockFilter, b: MockFilter): MockFilter {
  let filter = "";
  if (a.filter) {
    filter += a.filter;
  }
  if (b.filter) {
    filter += b.filter;
  }
  return { filter };
}

export const MockStream = new StreamConfig(
  MockFilterFromBytes,
  MockBlockFromBytes,
  mergeMockFilter,
);

export const MockStreamResponse = StreamDataResponse(MockBlockFromBytes);

export type MockStreamResponse = CodecType<typeof MockStreamResponse>;
