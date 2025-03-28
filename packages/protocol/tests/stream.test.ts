import { describe, expect, it } from "vitest";

import {
  type Codec,
  type CodecType,
  MessageCodec,
  StringCodec,
} from "../src/codec";
import { StreamDataRequest, StreamDataResponse } from "../src/stream";

const InnerData = MessageCodec({
  value: StringCodec,
});

type InnerData = CodecType<typeof InnerData>;

const TestData: Codec<InnerData | null, Uint8Array> = {
  decode(bytes) {
    const value = new TextDecoder().decode(bytes);
    return { value };
  },
  encode(value) {
    if (value === null) {
      return new Uint8Array();
    }
    return new TextEncoder().encode(value.value);
  },
};

const TestStreamDataRequest = StreamDataRequest(TestData);
const TestStreamDataResponse = StreamDataResponse(TestData);

type TestStreamDataResponse = CodecType<typeof TestStreamDataResponse>;
type TestStreamDataRequest = CodecType<typeof TestStreamDataRequest>;

describe("StreamDataRequest", () => {
  it("encodes and decodes", () => {
    const request: TestStreamDataRequest = {
      finality: "accepted",
      startingCursor: {
        orderKey: 5_000_000n,
      },
      filter: [{ value: "hello" }, { value: "world" }],
    };
    const proto = TestStreamDataRequest.encode(request);
    expect(proto).toMatchInlineSnapshot(`
      {
        "filter": [
          Uint8Array [
            104,
            101,
            108,
            108,
            111,
          ],
          Uint8Array [
            119,
            111,
            114,
            108,
            100,
          ],
        ],
        "finality": 2,
        "startingCursor": {
          "orderKey": 5000000n,
          "uniqueKey": Uint8Array [],
        },
      }
    `);
    const back = TestStreamDataRequest.decode(proto);
    expect(back).toEqual(request);
  });
});

describe("StreamDataResponse", () => {
  describe(".data", () => {
    it("encodes and decodes", () => {
      const message: TestStreamDataResponse = {
        _tag: "data",
        data: {
          finality: "accepted",
          data: [{ value: "hello" }, { value: "world" }],
          production: "backfill",
          endCursor: {
            orderKey: 5_000_000n,
            uniqueKey: "0x1234567890",
          },
        },
      } as const;

      const proto = TestStreamDataResponse.encode(message);
      expect(proto).toMatchInlineSnapshot(`
        {
          "$case": "data",
          "data": {
            "data": [
              Uint8Array [
                104,
                101,
                108,
                108,
                111,
              ],
              Uint8Array [
                119,
                111,
                114,
                108,
                100,
              ],
            ],
            "endCursor": {
              "orderKey": 5000000n,
              "uniqueKey": Uint8Array [
                18,
                52,
                86,
                120,
                144,
              ],
            },
            "finality": 2,
            "production": 1,
          },
        }
      `);
      const back = TestStreamDataResponse.decode(proto);
      expect(back).toEqual(message);
    });
  });

  describe(".invalidate", () => {
    it("encodes and decodes", () => {
      const invalidate: TestStreamDataResponse = {
        _tag: "invalidate",
        invalidate: {
          cursor: {
            orderKey: 5_000_000n,
            uniqueKey: "0x1234567890",
          },
        },
      };

      const proto = TestStreamDataResponse.encode(invalidate);
      expect(proto).toMatchInlineSnapshot(`
        {
          "$case": "invalidate",
          "invalidate": {
            "cursor": {
              "orderKey": 5000000n,
              "uniqueKey": Uint8Array [
                18,
                52,
                86,
                120,
                144,
              ],
            },
          },
        }
      `);
      const back = TestStreamDataResponse.decode(proto);
      expect(back).toEqual(invalidate);
    });
  });

  describe(".heartbeat", () => {
    it("encodes and decodes", () => {
      const heartbeat: TestStreamDataResponse = {
        _tag: "heartbeat",
      };

      const proto = TestStreamDataResponse.encode(heartbeat);
      expect(proto).toMatchInlineSnapshot(`
        {
          "$case": "heartbeat",
          "heartbeat": undefined,
        }
      `);
      const back = TestStreamDataResponse.decode(proto);
      expect(back).toEqual(heartbeat);
    });
  });

  describe(".systemMessage", () => {
    it("encodes and decodes stdout", () => {
      const message: TestStreamDataResponse = {
        _tag: "systemMessage",
        systemMessage: {
          output: {
            _tag: "stdout",
            stdout: "hello",
          },
        },
      };

      const proto = TestStreamDataResponse.encode(message);
      expect(proto).toMatchInlineSnapshot(`
        {
          "$case": "systemMessage",
          "systemMessage": {
            "output": {
              "$case": "stdout",
              "stdout": "hello",
            },
          },
        }
      `);
      const back = TestStreamDataResponse.decode(proto);
      expect(back).toEqual(message);
    });

    it("encodes and decodes stderr", () => {
      const message: TestStreamDataResponse = {
        _tag: "systemMessage",
        systemMessage: {
          output: {
            _tag: "stderr",
            stderr: "hello",
          },
        },
      };

      const proto = TestStreamDataResponse.encode(message);
      expect(proto).toMatchInlineSnapshot(`
        {
          "$case": "systemMessage",
          "systemMessage": {
            "output": {
              "$case": "stderr",
              "stderr": "hello",
            },
          },
        }
      `);
      const back = TestStreamDataResponse.decode(proto);
      expect(back).toEqual(message);
    });
  });
});
