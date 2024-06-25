import { encodeEventTopics, pad, parseAbi } from "viem";
import { describe, expect, it } from "vitest";

import { Schema } from "@effect/schema";
import { Filter, LogFilter, filterFromProto, filterToProto } from "./filter";

const abi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

describe("Filter", () => {
  it("all filters are optional", () => {
    const filter = Filter.make({});

    const proto = filterToProto(filter);
    const back = filterFromProto(proto);
    expect(back).toEqual(filter);
  });

  it("accepts logs filter", () => {
    const filter = Filter.make({
      logs: [
        {
          address: "0x123456789012",
          strict: true,
          topics: encodeEventTopics({
            abi,
            eventName: "Transfer",
            args: { from: null, to: null },
          }) as `0x${string}`[],
        },
      ],
    });

    expect(filter.logs).toHaveLength(1);

    const proto = filterToProto(filter);
    const back = filterFromProto(proto);

    expect(back).toBeDefined();
    expect(back.logs).toHaveLength(1);
  });
});

describe("LogFilter", () => {
  const encode = Schema.encodeSync(LogFilter);
  const decode = Schema.decodeSync(LogFilter);

  it("can be empty", () => {
    const filter = LogFilter.make({});

    const proto = encode(filter);
    const back = decode(proto);
    expect(back).toEqual(filter);
  });

  it("can have null topics", () => {
    const filter = LogFilter.make({
      topics: [null, pad("0x1"), null, pad("0x3")],
    });

    const proto = encode(filter);
    const back = decode(proto);
    expect(back).toEqual(filter);
  });

  it("can have all optional fields", () => {
    const filter = LogFilter.make({
      address: pad("0xa", { size: 20 }),
      topics: [null, pad("0x1"), null, pad("0x3")],
      includeTransaction: true,
      includeReceipt: true,
      strict: true,
    });

    const proto = encode(filter);
    const back = decode(proto);
    expect(back).toEqual(filter);
  });
});
