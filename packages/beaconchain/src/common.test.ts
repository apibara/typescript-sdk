import { describe, expect, it } from "vitest";

import { Schema } from "@effect/schema";
import { pad } from "viem";

import { B384 } from "./common";

describe("B384", () => {
  const encode = Schema.encodeSync(B384);
  const decode = Schema.decodeSync(B384);

  it("should convert from and to proto", () => {
    const value =
      "0x9df92d765b5aa041fd4bbe8d5878eb89290efa78e444c1a603eecfae2ea05fa4";

    const message = encode(value);

    const back = decode(message);
    expect(back).toEqual(pad(value, { size: 48 }));
  });
});
