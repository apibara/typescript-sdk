import { describe, expect, it } from "vitest";

import { Schema } from "@effect/schema";

import {
  Heartbeat,
  Invalidate,
  StreamDataRequest,
  StreamDataResponse,
  SystemMessage,
} from "./stream";

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

const TestStreamDataResponse = StreamDataResponse(TestData);

type TestStreamDataResponse = typeof TestStreamDataResponse.Type;

const encodeTestResponse = Schema.encodeSync(TestStreamDataResponse);
const decodeTestResponse = Schema.decodeSync(TestStreamDataResponse);

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
  const encode = encodeTestResponse;
  const decode = decodeTestResponse;

  describe(".data", () => {
    it("encodes and decodes", () => {
      const message: TestStreamDataResponse = {
        _tag: "data",
        data: {
          finality: "accepted",
          data: [{ value: "hello" }, { value: "world" }],
        },
      } as const;

      const proto = encode(message);
      expect(proto.$case).toBe("data");
      const back = decode(proto);
      expect(back).toEqual(message);
    });
  });

  describe(".invalidate", () => {
    it("encodes and decodes", () => {
      const invalidate = Invalidate.make({
        _tag: "invalidate",
        invalidate: {
          cursor: {
            orderKey: 5_000_000n,
            uniqueKey: "0x1234567890",
          },
        },
      });

      const proto = encode(invalidate);
      const back = decode(proto);
      expect(back).toEqual(invalidate);
    });
  });

  describe(".heartbeat", () => {
    it("encodes and decodes", () => {
      const heartbeat = Heartbeat.make({
        _tag: "heartbeat",
      });

      const proto = encode(heartbeat);
      const back = decode(proto);
      expect(back).toEqual(heartbeat);
    });
  });

  describe(".systemMessage", () => {
    it("encodes and decodes stdout", () => {
      const message = SystemMessage.make({
        _tag: "systemMessage",
        systemMessage: {
          output: {
            _tag: "stdout",
            stdout: "hello",
          },
        },
      });

      const proto = encode(message);
      const back = decode(proto);
      expect(back).toEqual(message);
    });

    it("encodes and decodes stderr", () => {
      const message = SystemMessage.make({
        _tag: "systemMessage",
        systemMessage: {
          output: {
            _tag: "stderr",
            stderr: "hello",
          },
        },
      });

      const proto = encode(message);
      const back = decode(proto);
      expect(back).toEqual(message);
    });
  });
});
