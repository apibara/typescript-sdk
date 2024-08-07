import { describe, expect, it } from "vitest";
import { createCursor, cursorFromProto, cursorToProto } from "./common";

describe("Cursor", () => {
  describe("proto", () => {
    it("should encode and decode (with uniqueKey)", () => {
      const cursor = createCursor({
        orderKey: 123n,
        uniqueKey: "0xcafecafe",
      });

      const proto = cursorToProto(cursor);
      expect(proto).toMatchInlineSnapshot(`
        {
          "orderKey": 123n,
          "uniqueKey": Uint8Array [
            202,
            254,
            202,
            254,
          ],
        }
      `);
      const back = cursorFromProto(proto);
      expect(back).toEqual(cursor);
    });

    it("should encode and decode (without uniqueKey)", () => {
      const cursor = createCursor({
        orderKey: 123n,
      });

      const proto = cursorToProto(cursor);
      expect(proto).toMatchInlineSnapshot(`
        {
          "orderKey": 123n,
          "uniqueKey": Uint8Array [],
        }
      `);
      const back = cursorFromProto(proto);
      expect(back).toEqual(cursor);
    });
  });

  describe("bytes", () => {
    it("should encode and decode (with uniqueKey)", () => {
      const cursor = createCursor({
        orderKey: 123n,
        uniqueKey: "0xcafecafe",
      });

      const proto = cursorToProto(cursor);
      const back = cursorFromProto(proto);
      expect(back).toEqual(cursor);
    });

    it("should encode and decode (without uniqueKey)", () => {
      const cursor = createCursor({
        orderKey: 123n,
      });

      const proto = cursorToProto(cursor);
      const back = cursorFromProto(proto);
      expect(back).toEqual(cursor);
    });
  });
});
