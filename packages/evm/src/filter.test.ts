import { describe, it, expect } from "vitest";
import { encodeEventTopics, parseAbi } from "viem";

import { Filter } from "./filter";

const abi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

describe("Filter", () => {
  it("all filters are optional", () => {
    const filter = new Filter({ logs: [] });

    expect(filter.header).toBeUndefined();
    expect(filter.logs).toHaveLength(0);

    const proto = filter.toProto();
    const back = Filter.fromProto(proto);
    expect(back).toBeDefined();
  });

  it("accepts logs filter", () => {
    const filter = new Filter({
      logs: [
        {
          address: "0x123456789012",
          strict: true,
          topics: encodeEventTopics({
            abi,
            eventName: "Transfer",
            args: { from: null, to: null },
          }),
        },
      ],
    });

    expect(filter.logs).toHaveLength(1);

    const proto = filter.toProto();
    const back = Filter.fromProto(proto);
    expect(back).toBeDefined();
    expect(back.logs).toHaveLength(1);
  });
});
