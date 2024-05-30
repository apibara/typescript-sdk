import { describe, expect, it } from "vitest";
import { Cursor } from "./common";

describe("Cursor", () => {
  describe("proto", () => {
    it("should encode and decode (with uniqueKey)", () => {
      const cursor = new Cursor({
        orderKey: 123n,
        uniqueKey: "0xdeadbeef",
      });

      const proto = cursor.toProto();
      const back = Cursor.fromProto(proto);
      expect(back).toEqual(cursor);
    });

    it("should encode and decode (without uniqueKey)", () => {
      const cursor = new Cursor({
        orderKey: 123n,
      });

      const proto = cursor.toProto();
      const back = Cursor.fromProto(proto);
      expect(back).toEqual(cursor);
    });
  });

  describe.skip("bytes", () => {
    it("should encode and decode (with uniqueKey)", () => {
      const cursor = new Cursor({
        orderKey: 123n,
        uniqueKey: "0xdeadbeef",
      });

      //   const bytes = cursor.toBytes();
      //   const back = Cursor.fromBytes(bytes);
      //   expect(back).toEqual(cursor);
    });

    it("should encode and decode (without uniqueKey)", () => {
      const cursor = new Cursor({
        orderKey: 123n,
      });

      //   const bytes = cursor.toBytes();
      //   const back = Cursor.fromBytes(bytes);
      //   expect(back).toEqual(cursor);
    });
  });
});
