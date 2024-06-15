import { describe, it, expect } from "vitest";

import { pad } from "viem";
import { Schema } from "@effect/schema";

import { Address, B256, U128, U256 } from "./common";

describe("Address", () => {
  const encode = Schema.encodeSync(Address);
  const decode = Schema.decodeSync(Address);

  it("should convert to and from proto", () => {
    const address = "0xcafe0000cafe";

    const message = encode(address);

    expect(message.loLo).toBeDefined();
    expect(message.loHi).toBeDefined();
    expect(message.hi).toBeDefined();

    const back = decode(message);
    expect(back).toEqual(pad(address, { size: 20 }));
  });
});

describe("B256", () => {
  const encode = Schema.encodeSync(B256);
  const decode = Schema.decodeSync(B256);

  it("should convert to and from proto", () => {
    const value = "0xcafe1111cafe";
    const message = encode(value);

    expect(message.loLo).toBeDefined();
    expect(message.loHi).toBeDefined();
    expect(message.hiLo).toBeDefined();
    expect(message.hiHi).toBeDefined();

    const back = decode(message);
    expect(back).toEqual(pad(value, { size: 32 }));
  });
});

describe("U256", () => {
  const encode = Schema.encodeSync(U256);
  const decode = Schema.decodeSync(U256);

  it("should convert to and from proto", () => {
    const value = BigInt("0xcafe1111cafe");
    const message = encode(value);

    expect(message.loLo).toBeDefined();
    expect(message.loHi).toBeDefined();
    expect(message.hiLo).toBeDefined();
    expect(message.hiHi).toBeDefined();

    const back = decode(message);
    expect(back).toEqual(value);
  });
});

describe("U128", () => {
  const encode = Schema.encodeSync(U128);
  const decode = Schema.decodeSync(U128);

  it("should convert to and from proto", () => {
    const value = BigInt("0xcafe1111cafe");
    const message = encode(value);

    expect(message.lo).toBeDefined();
    expect(message.hi).toBeDefined();

    const back = decode(message);
    expect(back).toEqual(value);
  });
});
