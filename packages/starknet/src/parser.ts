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
    out: String(data[offset]),
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

export function parseEmpty(data: readonly FieldElement[], offset: number) {
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

export function parseStruct<T extends { [key: string]: unknown }>(
  parsers: { [K in keyof T]: { index: number; parser: Parser<T[K]> } },
) {
  const sortedParsers = Object.entries(parsers).sort(
    (a, b) => a[1].index - b[1].index,
  );
  return (data: readonly FieldElement[], startingOffset: number) => {
    let offset = startingOffset;
    const out: Record<string, unknown> = {};
    for (const [key, { parser }] of sortedParsers) {
      const { out: value, offset: newOffset } = parser(data, offset);
      out[key] = value;
      offset = newOffset;
    }
    return { out, offset };
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
