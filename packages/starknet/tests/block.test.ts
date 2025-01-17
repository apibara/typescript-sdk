import { Schema } from "@effect/schema";
import { describe, expect, it } from "vitest";

import { BlockFromBytes } from "../src/block";

import { largeBlock } from "./fixtures";

const decode = Schema.decodeSync(BlockFromBytes);

describe("BlockFromBytes", () => {
  it("decode", () => {
    const block = decode(largeBlock);
    expect(block?.header).toBeDefined();
    expect(block?.events).toHaveLength(919);
    expect(block?.transactions).toHaveLength(50);
    expect(block?.receipts).toHaveLength(50);
    expect(block?.storageDiffs).toHaveLength(21);
    expect(block?.contractChanges).toHaveLength(1);
    expect(block?.nonceUpdates).toHaveLength(37);
  });
});
