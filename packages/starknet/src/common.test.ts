import { describe, expect, it } from "vitest";

import { pad } from "viem";

import { feltFromProto, feltToProto } from "./common";

describe("FieldElement", () => {
  it("should convert to and from proto", () => {
    const felt = "0xcafe0000cafe";

    const message = feltToProto(felt);

    expect(message.x0).toBeDefined();
    expect(message.x1).toBeDefined();
    expect(message.x2).toBeDefined();
    expect(message.x3).toBeDefined();

    const back = feltFromProto(message);
    expect(back).toEqual(pad(felt, { size: 32 }));
  });
});
