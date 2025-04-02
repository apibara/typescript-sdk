import { describe, expect, it } from "vitest";

import { StatusRequest, StatusResponse } from "../src/status";

describe("StatusRequest", () => {
  describe("proto", () => {
    it("should encode and decode", () => {
      const proto = StatusRequest.encode({});
      expect(proto).toMatchInlineSnapshot("{}");
      const back = StatusRequest.decode(proto);
      expect(back).toEqual({});
    });
  });
});

describe("StatusResponse", () => {
  describe("proto", () => {
    it("should encode and decode", () => {
      const response: StatusResponse = {
        currentHead: {
          orderKey: 123n,
        },
        lastIngested: {
          orderKey: 123n,
        },
      };

      const proto = StatusResponse.encode(response);
      expect(proto).toMatchInlineSnapshot(`
        {
          "currentHead": {
            "orderKey": 123n,
            "uniqueKey": Uint8Array [],
          },
          "lastIngested": {
            "orderKey": 123n,
            "uniqueKey": Uint8Array [],
          },
        }
      `);
      const back = StatusResponse.decode(proto);
      expect(back).toEqual(response);
    });
  });
});
