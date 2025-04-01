import { describe, expect, it } from "vitest";
import { Cursor, createCursor } from "../src/common";

describe("Cursor", () => {
  describe("proto", () => {
    it("should encode and decode (with uniqueKey)", () => {
      const cursor = createCursor({
        orderKey: 123n,
        uniqueKey: "0xcafecafe",
      });

      const proto = Cursor.encode(cursor);
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
      const back = Cursor.decode(proto);
      expect(back).toEqual(cursor);
    });

    it("should encode and decode (without uniqueKey)", () => {
      const cursor = createCursor({
        orderKey: 123n,
      });

      const proto = Cursor.encode(cursor);
      expect(proto).toMatchInlineSnapshot(`
        {
          "orderKey": 123n,
          "uniqueKey": Uint8Array [],
        }
      `);
      const back = Cursor.decode(proto);
      expect(back).toEqual(cursor);
    });
  });

  describe("bytes", () => {
    it("should encode and decode (with uniqueKey)", () => {
      const cursor = createCursor({
        orderKey: 123n,
        uniqueKey: "0xcafecafe",
      });

      const proto = Cursor.encode(cursor);
      const back = Cursor.decode(proto);
      expect(back).toEqual(cursor);
    });

    it("should encode and decode (without uniqueKey)", () => {
      const cursor = createCursor({
        orderKey: 123n,
      });

      const proto = Cursor.encode(cursor);
      const back = Cursor.decode(proto);
      expect(back).toEqual(cursor);
    });
  });
});
