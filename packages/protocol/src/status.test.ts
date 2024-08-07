import { describe, expect, it } from "vitest";

import {
  StatusResponse,
  statusRequestFromProto,
  statusRequestToProto,
  statusResponseFromProto,
  statusResponseToProto,
} from "./status";

describe("StatusRequest", () => {
  describe("proto", () => {
    it("should encode and decode", () => {
      const proto = statusRequestToProto({});
      expect(proto).toMatchInlineSnapshot("{}");
      const back = statusRequestFromProto(proto);
      expect(back).toEqual({});
    });
  });
});

describe("StatusResponse", () => {
  describe("proto", () => {
    it("should encode and decode", () => {
      const response = StatusResponse.make({
        currentHead: {
          orderKey: 123n,
        },
        lastIngested: {
          orderKey: 123n,
        },
      });

      const proto = statusResponseToProto(response);
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
      const back = statusResponseFromProto(proto);
      expect(back).toEqual(response);
    });
  });
});
