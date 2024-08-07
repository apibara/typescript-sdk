import { Schema } from "@effect/schema";
import { describe, expect, it } from "vitest";

import { type MockBlock, MockBlockFromBytes, MockStream } from "./mock";

describe("MockBlock", () => {
  const encode = Schema.encodeSync(MockBlockFromBytes);
  const decode = Schema.decodeSync(MockBlockFromBytes);

  it("can be encoded and decoded", () => {
    const block = { data: "hello" } satisfies MockBlock;

    const proto = encode(block);
    const back = decode(proto);

    expect(back).toEqual(block);
  });

  it("encodes null as empty data", () => {
    const proto = encode(null);
    expect(proto).toEqual(new Uint8Array());
  });

  it("decodes empty data as null", () => {
    const block = decode(new Uint8Array());
    expect(block).toBe(null);
  });
});

describe("MockStream", () => {
  it("allow filters to be merged", () => {
    const f = MockStream.mergeFilter({ filter: "hello" }, { filter: "world" });
    expect(f).toEqual({ filter: "helloworld" });
  });
});
