import { describe, expect, it } from "vitest";

import { Schema } from "@effect/schema";

import { Invalidate, StreamDataRequest } from "./stream";

const InnerData = Schema.Struct({
  value: Schema.String,
});

const TestData = Schema.transform(Schema.Uint8ArrayFromSelf, InnerData, {
  decode(bytes) {
    const value = new TextDecoder().decode(bytes);
    return { value };
  },
  encode({ value }) {
    return new TextEncoder().encode(value);
  },
});

const TestStreamDataRequest = StreamDataRequest(TestData);

const encodeTestRequest = Schema.encodeSync(TestStreamDataRequest);
const decodeTestRequest = Schema.decodeSync(TestStreamDataRequest);

describe("StreamDataRequest", () => {
  it("encodes and decodes", () => {
    const request = TestStreamDataRequest.make({
      finality: "accepted",
      startingCursor: {
        orderKey: 5_000_000n,
      },
      filter: [{ value: "hello" }, { value: "world" }],
    });

    const proto = encodeTestRequest(request);
    expect(proto.filter).toHaveLength(2);
    const back = decodeTestRequest(proto);
    expect(request).toEqual(back);
  });
});

describe("StreamDataResponse", () => {
  describe(".invalidate", () => {
    it("encodes and decodes", () => {
      const message = Invalidate.make({});
    });
  });
});
