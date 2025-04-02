import { pad } from "viem";
import { describe, expect, it } from "vitest";

import { Address, B256, B384, U128, U256 } from "../src/common";

describe("Address", () => {
  it("should convert to and from proto", () => {
    const address = "0x27504265a9bc4330e3fe82061a60cd8b6369b4dc";
    const message = Address.encode(address);
    expect(message.x0).toEqual(2832837170022859568n);
    expect(message.x1).toEqual(16428711453418114443n);
    expect(message.x2).toEqual(1667871964);

    const back = Address.decode(message);
    expect(back).toEqual(pad(address, { size: 20 }));
  });
});

describe("B256", () => {
  it("should convert to and from proto", () => {
    const value =
      "0x9df92d765b5aa041fd4bbe8d5878eb89290efa78e444c1a603eecfae2ea05fa4";
    const message = B256.encode(value);

    expect(message.x0).toEqual(11383179519517696065n);
    expect(message.x1).toEqual(18251891429133052809n);
    expect(message.x2).toEqual(2958577402361725350n);
    expect(message.x3).toEqual(283392173584441252n);

    const back = B256.decode(message);
    expect(back).toEqual(pad(value, { size: 32 }));
  });
});

describe("U256", () => {
  it("should convert to and from proto", () => {
    const value = BigInt(
      "0x9df92d765b5aa041fd4bbe8d5878eb89290efa78e444c1a603eecfae2ea05fa4",
    );
    const message = U256.encode(value);

    expect(message.x0).toEqual(11383179519517696065n);
    expect(message.x1).toEqual(18251891429133052809n);
    expect(message.x2).toEqual(2958577402361725350n);
    expect(message.x3).toEqual(283392173584441252n);

    const back = U256.decode(message);
    expect(back).toEqual(value);
  });
});

describe("U128", () => {
  it("should convert to and from proto", () => {
    const value = BigInt("0x090efa78e444c1a603eecfae2ea05fa4");
    const message = U128.encode(value);

    expect(message.x0).toEqual(652734393148031398n);
    expect(message.x1).toEqual(283392173584441252n);

    const back = U128.decode(message);
    expect(back).toEqual(value);
  });
});

describe("B384", () => {
  it("should convert from and to proto", () => {
    const value =
      "0x9df92d765b5aa041fd4bbe8d5878eb89290efa78e444c1a603eecfae2ea05fa4";
    const message = B384.encode(value);

    expect(message.x0).toEqual(0n);
    expect(message.x1).toEqual(0n);
    expect(message.x2).toEqual(11383179519517696065n);
    expect(message.x3).toEqual(18251891429133052809n);
    expect(message.x4).toEqual(2958577402361725350n);
    expect(message.x5).toEqual(283392173584441252n);

    const back = B384.decode(message);
    expect(back).toEqual(pad(value, { size: 48 }));
  });
});
