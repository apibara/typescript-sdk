import { describe, expect, it } from "vitest";

import {
  ParseError,
  parseArray,
  parseAsHex,
  parseBool,
  parseFelt252,
  parseOption,
  parseStruct,
  parseTuple,
  parseU8,
  parseU16,
  parseU32,
  parseU64,
  parseU128,
  parseU256,
} from "./parser";

describe("Primitive types parser", () => {
  it("can parse a bool", () => {
    const data = ["0x1", "0x0"] as const;
    const { out, offset } = parseBool(data, 0);
    expect(out).toBe(true);
    expect(offset).toBe(1);
  });

  it("can parse a u8", () => {
    const data = ["0xf", "0x0"] as const;
    const { out, offset } = parseU8(data, 0);
    expect(out).toBe(15n);
    expect(offset).toBe(1);
  });

  it("can parse a u16", () => {
    const data = ["0x1234", "0x0"] as const;
    const { out, offset } = parseU16(data, 0);
    expect(out).toBe(4660n);
    expect(offset).toBe(1);
  });

  it("can parse a u32", () => {
    const data = ["0x12345678", "0x0"] as const;
    const { out, offset } = parseU32(data, 0);
    expect(out).toBe(305419896n);
    expect(offset).toBe(1);
  });

  it("can parse a u64", () => {
    const data = ["0x1234567890abcdef", "0x0"] as const;
    const { out, offset } = parseU64(data, 0);
    expect(out).toBe(1311768467294899695n);
    expect(offset).toBe(1);
  });

  it("can parse a u128", () => {
    const data = ["0x1234567890abcdef1234567890abcdef", "0x0"] as const;
    const { out, offset } = parseU128(data, 0);
    expect(out).toBe(24197857200151252728969465429440056815n);
    expect(offset).toBe(1);
  });

  it("can parse a u256", () => {
    const data = ["0x1234567890abcdef1234567890abcdef", "0x0"] as const;
    const { out, offset } = parseU256(data, 0);
    expect(out).toBe(24197857200151252728969465429440056815n);
    expect(offset).toBe(2);
  });

  it("can parse an address", () => {
    const data = ["0x1234567890abcdef1234567890abcdef", "0x0"] as const;
    const { out, offset } = parseAsHex(data, 0);
    expect(out).toBe("0x1234567890abcdef1234567890abcdef");
    expect(offset).toBe(1);
  });

  it("can parse a felt252", () => {
    const data = ["0x1234567890abcdef1234567890abcdef", "0x0"] as const;
    const { out, offset } = parseFelt252(data, 0);
    expect(out).toBe(24197857200151252728969465429440056815n);
    expect(offset).toBe(1);
  });
});

describe("Array parser", () => {
  it("can parse an array", () => {
    const data = ["0x3", "0x1", "0x2", "0x3"] as const;
    const { out, offset } = parseArray(parseU8)(data, 0);
    expect(out).toEqual([1n, 2n, 3n]);
    expect(offset).toBe(4);
  });

  it("throws an error if there is not enough data", () => {
    const data = ["0x3", "0x1", "0x2"] as const;
    expect(() => parseArray(parseU8)(data, 0)).toThrow(ParseError);
  });
});

describe("Option parser", () => {
  it("can parse an option", () => {
    const data = ["0x1", "0x2"] as const;
    const { out, offset } = parseOption(parseU8)(data, 0);
    expect(out).toBe(2n);
    expect(offset).toBe(2);
  });

  it("returns null if the option is not present", () => {
    const data = ["0x0"] as const;
    const { out, offset } = parseOption(parseU8)(data, 0);
    expect(out).toBeNull();
    expect(offset).toBe(1);
  });
});

describe("Struct parser", () => {
  it("can parse a struct with primitive types", () => {
    const data = ["0x1", "0x2", "0x3"] as const;
    const { out, offset } = parseStruct({
      a: { index: 0, parser: parseU8 },
      b: { index: 1, parser: parseU8 },
      c: { index: 2, parser: parseU8 },
    })(data, 0);
    expect(out).toEqual({ a: 1n, b: 2n, c: 3n });
    expect(offset).toBe(3);
  });

  it("can parse a struct with an option", () => {
    const data = ["0x1", "0x1", "0x3"] as const;
    const { out, offset } = parseStruct({
      a: { index: 0, parser: parseU8 },
      b: { index: 1, parser: parseOption(parseU8) },
    })(data, 0);
    expect(out).toEqual({ a: 1n, b: 3n });
    expect(offset).toBe(3);
  });

  it("can parse a nested struct", () => {
    const data = ["0x1", "0x2"] as const;
    const { out, offset } = parseStruct({
      a: { index: 0, parser: parseU8 },
      b: {
        index: 1,
        parser: parseStruct({ c: { index: 0, parser: parseU8 } }),
      },
    })(data, 0);
    expect(out).toEqual({ a: 1n, b: { c: 2n } });
    expect(offset).toBe(2);
  });
});

describe("Tuple parser", () => {
  it("can parse a tuple", () => {
    const data = ["0x1", "0x2", "0x0"] as const;
    const { out, offset } = parseTuple(parseU8, parseAsHex, parseBool)(data, 0);
    expect(out).toEqual([1n, "0x2", false]);
    expect(offset).toBe(3);
  });

  it("can parse a nested tuple", () => {
    const data = ["0x1", "0x2", "0x3", "0x0"] as const;
    const { out, offset } = parseTuple(
      parseU8,
      parseTuple(parseU8, parseU8),
      parseBool,
    )(data, 0);
    expect(out).toEqual([1n, [2n, 3n], false]);
    expect(offset).toBe(4);
  });
});
