import { describe, expect, it } from "vitest";

import { Cursor } from "./common";
import { StatusRequest, StatusResponse } from "./status";

describe("StatusRequest", () => {
  describe("proto", () => {
    it("should encode and decode", () => {
      const request = new StatusRequest();

      const proto = request.toProto();
      const back = StatusRequest.fromProto(proto);
      expect(back).toEqual(request);
    });
  });
});

describe("StatusResponse", () => {
  describe("proto", () => {
    it("should encode and decode", () => {
      const request = new StatusResponse({
        currentHead: new Cursor({
          orderKey: 123n,
        }),
        lastIngested: new Cursor({
          orderKey: 123n,
        }),
      });

      const proto = request.toProto();
      const back = StatusResponse.fromProto(proto);
      expect(back).toEqual(request);
    });
  });
});
