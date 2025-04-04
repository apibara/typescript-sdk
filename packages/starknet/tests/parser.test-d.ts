import { describe, expectTypeOf, it } from "vitest";
import {
  parseArray,
  parseBool,
  parseContractAddress,
  parseEthAddress,
  parseOption,
  parseStruct,
  parseTuple,
  parseU8,
  parseU256,
} from "../src/parser";

describe("Array parser", () => {
  it("has the type of the inner parser", () => {
    const { out } = parseArray(parseU256)([], 0);
    expectTypeOf(out).toMatchTypeOf<bigint[]>();
  });
});

describe("Option parser", () => {
  it("has the type of the inner parser", () => {
    const { out } = parseOption(parseContractAddress)([], 0);

    expectTypeOf(out).toMatchTypeOf<`0x${string}` | null>();
  });
});

describe("Struct parser", () => {
  it("parses simple structs ", () => {
    const { out } = parseStruct({
      a: { index: 0, parser: parseEthAddress },
      b: { index: 1, parser: parseOption(parseU256) },
    })([], 0);

    expectTypeOf(out).toMatchTypeOf<{ a: `0x${string}`; b: bigint | null }>();
  });

  it("parses nested structs", () => {
    const parseN = parseStruct({
      x: { index: 0, parser: parseU8 },
      y: { index: 1, parser: parseBool },
    });

    const { out } = parseStruct({
      a: { index: 0, parser: parseArray(parseN) },
      b: { index: 1, parser: parseN },
    })([], 0);

    expectTypeOf(out).toMatchTypeOf<{
      a: { x: bigint; y: boolean }[];
      b: { x: bigint; y: boolean };
    }>();
  });
});

describe("Tuple parser", () => {
  it("has the type of the inner parser", () => {
    const { out } = parseTuple(parseU256, parseEthAddress)([], 0);

    expectTypeOf(out).toMatchTypeOf<[bigint, `0x${string}`]>();
  });
});
