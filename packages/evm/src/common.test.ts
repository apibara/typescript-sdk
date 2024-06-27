import { describe, expect, it } from "vitest";

import { Schema } from "@effect/schema";
import { pad } from "viem";

import { Address, B256, U128, U256 } from "./common";

describe("Address", () => {
  const encode = Schema.encodeSync(Address);
  const decode = Schema.decodeSync(Address);

  it("should convert to and from proto", () => {
    const address = "0x27504265a9bc4330e3fe82061a60cd8b6369b4dc";

    const message = encode(address);

    expect(message.x0).toBeDefined();
    expect(message.x1).toBeDefined();
    expect(message.x2).toBeDefined();

    const back = decode(message);
    expect(back).toEqual(pad(address, { size: 20 }));
  });
});

describe("B256", () => {
  const encode = Schema.encodeSync(B256);
  const decode = Schema.decodeSync(B256);

  it("should convert to and from proto", () => {
    const value =
      "0x9df92d765b5aa041fd4bbe8d5878eb89290efa78e444c1a603eecfae2ea05fa4";
    const message = encode(value);

    expect(message.x0).toBeDefined();
    expect(message.x1).toBeDefined();
    expect(message.x2).toBeDefined();
    expect(message.x3).toBeDefined();

    const back = decode(message);
    expect(back).toEqual(pad(value, { size: 32 }));
  });
});

describe("U256", () => {
  const encode = Schema.encodeSync(U256);
  const decode = Schema.decodeSync(U256);

  it("should convert to and from proto", () => {
    const value = BigInt(
      "0x9df92d765b5aa041fd4bbe8d5878eb89290efa78e444c1a603eecfae2ea05fa4",
    );
    const message = encode(value);

    expect(message.x0).toBeDefined();
    expect(message.x1).toBeDefined();
    expect(message.x2).toBeDefined();
    expect(message.x3).toBeDefined();

    const back = decode(message);
    expect(back).toEqual(value);
  });
});

describe("U128", () => {
  const encode = Schema.encodeSync(U128);
  const decode = Schema.decodeSync(U128);

  it("should convert to and from proto", () => {
    const value = BigInt("0x090efa78e444c1a603eecfae2ea05fa4");
    const message = encode(value);

    expect(message.x0).toBeDefined();
    expect(message.x1).toBeDefined();

    const back = decode(message);
    expect(back).toEqual(value);
  });
});
