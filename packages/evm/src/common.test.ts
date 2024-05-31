import { describe, it, expect } from "vitest";

import { pad } from "viem";
import { Schema } from "@effect/schema";

import { Address, B256 } from "./common";

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