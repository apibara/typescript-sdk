import { describe, expect, it } from "vitest";

import {
  type MockBlock,
  MockBlockFromBytes,
  MockStream,
} from "../src/testing/mock";

describe("MockBlock", () => {
  it("can be encoded and decoded", () => {
    const block = { data: "hello" } satisfies MockBlock;

    const proto = MockBlockFromBytes.encode(block);
    const back = MockBlockFromBytes.decode(proto);

    expect(back).toEqual(block);
  });

  it("encodes null as empty data", () => {
    const proto = MockBlockFromBytes.encode(null);
    expect(proto).toEqual(new Uint8Array());
  });

  it("decodes empty data as null", () => {
    const block = MockBlockFromBytes.decode(new Uint8Array());
    expect(block).toBe(null);
  });
});

describe("MockStream", () => {
  it("allow filters to be merged", () => {
    const f = MockStream.mergeFilter({ filter: "hello" }, { filter: "world" });
    expect(f).toEqual({ filter: "helloworld" });
  });
});
