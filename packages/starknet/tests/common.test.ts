import { pad } from "viem";
import { describe, expect, it } from "vitest";

import { FieldElement } from "../src/common";

describe("FieldElement", () => {
  it("should convert to and from proto", () => {
    const felt = "0xcafe0000cafe";

    const message = FieldElement.encode(felt);

    expect(message.x0).toEqual(0n);
    expect(message.x1).toEqual(0n);
    expect(message.x2).toEqual(0n);
    expect(message.x3).toEqual(223192270555902n);

    const back = FieldElement.decode(message);
    expect(back).toEqual(pad(felt, { size: 32 }));
  });

  it("should convert to and from proto - large value", () => {
    const hex =
      "0x9df92d765b5aa041fd4bbe8d5878eb89290efa78e444c1a603eecfae2ea05fa4";

    const message = FieldElement.encode(hex);

    expect(message.x0).toEqual(11383179519517696065n);
    expect(message.x1).toEqual(18251891429133052809n);
    expect(message.x2).toEqual(2958577402361725350n);
    expect(message.x3).toEqual(283392173584441252n);

    const back = FieldElement.decode(message);
    expect(back).toEqual(hex);
  });

  it("should convert to and from proto - small value", () => {
    const smallValue = "0x000000000000000000000000000004d2"; // 1234 in hex

    const message = FieldElement.encode(smallValue);

    expect(message.x0).toEqual(0n);
    expect(message.x1).toEqual(0n);
    expect(message.x2).toEqual(0n);
    expect(message.x3).toEqual(1234n);

    const back = FieldElement.decode(message);
    expect(back).toEqual(pad(smallValue, { size: 32 }));
  });
});
