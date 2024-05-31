import { describe, expect, it } from "vitest";
import {
  Cursor,
  cursorFromBytes,
  cursorFromProto,
  cursorToBytes,
  cursorToProto,
} from "./common";

describe("Cursor", () => {
  describe("proto", () => {
    it("should encode and decode (with uniqueKey)", () => {
      const cursor = Cursor.make({
        orderKey: 123n,
        uniqueKey: "0xcafecafe",
      });

      const proto = cursorToProto(cursor);
      const back = cursorFromProto(proto);
      expect(back).toEqual(cursor);
    });

    it("should encode and decode (without uniqueKey)", () => {
      const cursor = Cursor.make({
        orderKey: 123n,
      });

      const proto = cursorToProto(cursor);
      const back = cursorFromProto(proto);
      expect(back).toEqual(cursor);
    });
  });

  describe("bytes", () => {
    it("should encode and decode (with uniqueKey)", () => {
      const cursor = Cursor.make({
        orderKey: 123n,
        uniqueKey: "0xcafecafe",
      });

      const proto = cursorToProto(cursor);
      const back = cursorFromProto(proto);
      expect(back).toEqual(cursor);
    });

    it("should encode and decode (without uniqueKey)", () => {
      const cursor = Cursor.make({
        orderKey: 123n,
      });

      const proto = cursorToProto(cursor);
      const back = cursorFromProto(proto);
      expect(back).toEqual(cursor);
    });
  });
});
