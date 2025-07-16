/*
 * Calldata combinatorial parsers.
 *
 * Based on the Ekubo's event parser.
 *
 * MIT License
 *
 * Copyright (c) 2023 Ekubo, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import type { FieldElement } from "./common";

export type Parser<TOut> = (
  data: readonly FieldElement[],
  offset: number,
) => { out: TOut; offset: number };

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

// Primitive types.

function assertInBounds(data: readonly FieldElement[], offset: number) {
  if (offset >= data.length) {
    throw new ParseError(
      `Offset out of bounds. Data length ${data.length}, offset ${offset}`,
    );
  }
}

export function parseBool(data: readonly FieldElement[], offset: number) {
  assertInBounds(data, offset);
  return { out: BigInt(data[offset]) > 0n, offset: offset + 1 };
}

export function parseAsBigInt(data: readonly FieldElement[], offset: number) {
  assertInBounds(data, offset);
  return { out: BigInt(data[offset]), offset: offset + 1 };
}

export const parseU8 = parseAsBigInt;
export const parseU16 = parseAsBigInt;
export const parseU32 = parseAsBigInt;
export const parseU64 = parseAsBigInt;
export const parseU128 = parseAsBigInt;
export const parseUsize = parseAsBigInt;

export function parseU256(data: readonly FieldElement[], offset: number) {
  assertInBounds(data, offset + 1);
  return {
    out: BigInt(data[offset]) + (BigInt(data[offset + 1]) << 128n),
    offset: offset + 2,
  };
}

export function parseAsHex(data: readonly FieldElement[], offset: number) {
  assertInBounds(data, offset);
  return {
    out: data[offset],
    offset: offset + 1,
  };
}

export const parseContractAddress = parseAsHex;
export const parseEthAddress = parseAsHex;
export const parseStorageAddress = parseAsHex;
export const parseClassHash = parseAsHex;
export const parseBytes31 = parseAsHex;

export function parseFelt252(data: readonly FieldElement[], offset: number) {
  assertInBounds(data, offset);
  return {
    out: BigInt(data[offset]),
    offset: offset + 1,
  };
}

export function parseEmpty(_data: readonly FieldElement[], offset: number) {
  return { out: null, offset };
}

// Higher-level types.

export function parseArray<T>(type: Parser<T>): Parser<T[]> {
  return (data: readonly FieldElement[], startingOffset: number) => {
    let offset = startingOffset;
    const length = BigInt(data[offset]);

    offset++;

    const out: T[] = [];
    for (let i = 0; i < length; i++) {
      const { out: item, offset: newOffset } = type(data, offset);
      out.push(item);
      offset = newOffset;
    }

    return { out, offset };
  };
}

export const parseSpan = parseArray;

export function parseOption<T>(type: Parser<T>) {
  return (data: readonly FieldElement[], offset: number) => {
    const hasValue = BigInt(data[offset]) === 1n;
    if (hasValue) {
      return type(data, offset + 1);
    }
    return { out: null, offset: offset + 1 };
  };
}

export function parseStruct<T extends Record<string, unknown>>(
  parsers: {
    [K in keyof T]: { index: number; parser: Parser<T[K]> };
  },
): Parser<{ [K in keyof T]: T[K] }> {
  const sortedParsers = Object.entries(parsers).sort(
    (a, b) => a[1].index - b[1].index,
  );
  const parser = (data: readonly FieldElement[], startingOffset: number) => {
    let offset = startingOffset;
    const out: Record<string, unknown> = {};
    for (const [key, { parser }] of sortedParsers) {
      const { out: value, offset: newOffset } = parser(data, offset);
      out[key] = value;
      offset = newOffset;
    }
    return { out, offset };
  };
  return parser as Parser<{ [K in keyof T]: T[K] }>;
}

export function parseEnum<T extends Record<string, unknown>>(
  parsers: {
    [K in keyof T]: { index: number; parser: Parser<T[K]> };
  },
): Parser<T[keyof T]> {
  return (data: readonly FieldElement[], startingOffset: number) => {
    const selectorFelt = data[startingOffset];
    const selector = Number(BigInt(selectorFelt));

    // Find the parser by index
    const parserEntry = Object.entries(parsers).find(
      ([, { index }]) => index === selector,
    );

    if (!parserEntry) {
      throw new ParseError(`Unknown enum variant selector: ${selector}`);
    }

    const [variantName, { parser }] = parserEntry;
    const { out, offset: newOffset } = parser(data, startingOffset + 1);

    return {
      out: { _tag: variantName, [variantName]: out } as T[keyof T],
      offset: newOffset,
    };
  };
}

export function parseTuple<T extends Parser<unknown>[]>(
  ...parsers: T
): Parser<UnwrapParsers<T>> {
  return (data: readonly FieldElement[], startingOffset: number) => {
    let offset = startingOffset;
    const out = [];
    for (const parser of parsers) {
      const { out: value, offset: newOffset } = parser(data, offset);
      out.push(value);
      offset = newOffset;
    }
    return { out, offset } as { out: UnwrapParsers<T>; offset: number };
  };
}

type UnwrapParsers<TP> = {
  [Index in keyof TP]: TP[Index] extends Parser<infer U> ? U : never;
};

const parseByteArrayStruct = parseStruct({
  data: {
    index: 0,
    parser: parseArray(parseBytes31),
  },
  pendingWord: { index: 1, parser: parseFelt252 },
  pendingWordLen: { index: 2, parser: parseU32 },
});

export function parseByteArray(data: readonly FieldElement[], offset: number) {
  // A ByteArray is a struct with the following abi:
  //
  // {
  //   name: "core::byte_array::ByteArray",
  //   type: "struct",
  //   members: [
  //     {
  //       name: "data",
  //       type: "core::array::Array::<core::bytes_31::bytes31>",
  //     },
  //     {
  //       name: "pending_word",
  //       type: "core::felt252",
  //     },
  //     {
  //       name: "pending_word_len",
  //       type: "core::integer::u32",
  //     },
  //   ],
  // },
  //
  // We first parse it using a parser for that struct, then convert it to the output `0x${string}` type.
  const { out, offset: offsetOut } = parseByteArrayStruct(data, offset);

  // Remove 0x prefix from data elements and pad them to 31 bytes.
  const dataBytes = out.data
    .map((bytes) => bytes.slice(2).padStart(62, "0"))
    .join("");

  let pending = out.pendingWord.toString(16);
  const pendingWordLength = Number(out.pendingWordLen);
  if (pending.length < pendingWordLength * 2) {
    pending = pending.padStart(pendingWordLength * 2, "0");
  }

  const pendingBytes = pending.slice(pending.length - 2 * pendingWordLength);
  const bytes = removeLeadingZeros(dataBytes + pendingBytes);

  return { out: `0x${bytes}`, offset: offsetOut };
}

function removeLeadingZeros(bytes: string): string {
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] !== "0") {
      let j = i;
      if (i % 2 !== 0) {
        j -= 1;
      }
      return bytes.slice(j);
    }
  }
  // The bytes are all 0, so return something reasonable.
  return "00";
}
