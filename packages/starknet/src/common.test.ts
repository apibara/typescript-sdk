import { describe, expect, it } from "vitest";

import { pad } from "viem";

import { feltFromProto, feltToProto } from "./common";

describe("FieldElement", () => {
  it("should convert to and from proto", () => {
    const felt = "0xcafe0000cafe";

    const message = feltToProto(felt);

    expect(message.loLo).toBeDefined();
    expect(message.loHi).toBeDefined();
    expect(message.hiLo).toBeDefined();
    expect(message.hiHi).toBeDefined();

    const back = feltFromProto(message);
    expect(back).toEqual(pad(felt, { size: 32 }));
  });
});
