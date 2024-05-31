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
      const back = statusResponseFromProto(proto);
      expect(back).toEqual(response);
    });
  });
});
