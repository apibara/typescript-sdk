import { encodeEventTopics, pad, parseAbi } from "viem";
import { describe, expect, it } from "vitest";
import { Filter, LogFilter, mergeFilter } from "../src/filter";

const abi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

describe("Filter", () => {
  it("all filters are optional", () => {
    const filter: Filter = {};

    const proto = Filter.encode(filter);
    const back = Filter.decode(proto);
    expect(back).toEqual(filter);
  });

  it("accepts logs filter", () => {
    const filter: Filter = {
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
    };

    expect(filter.logs).toHaveLength(1);

    const proto = Filter.encode(filter);
    const back = Filter.decode(proto);

    expect(back).toBeDefined();
    expect(back.logs).toHaveLength(1);
  });
});

describe("LogFilter", () => {
  it("can be empty", () => {
    const filter: LogFilter = {};

    const proto = LogFilter.encode(filter);
    const back = LogFilter.decode(proto);
    expect(back).toEqual(filter);
  });

  it("can have null topics", () => {
    const filter: LogFilter = {
      topics: [null, pad("0x1"), null, pad("0x3")],
    };

    const proto = LogFilter.encode(filter);
    const back = LogFilter.decode(proto);
    expect(back).toEqual(filter);
  });

  it("can have all optional fields", () => {
    const filter: LogFilter = {
      address: pad("0xa", { size: 20 }),
      topics: [null, pad("0x1"), null, pad("0x3")],
      includeTransaction: true,
      includeReceipt: true,
      strict: true,
    };

    const proto = LogFilter.encode(filter);
    const back = LogFilter.decode(proto);
    expect(back).toEqual(filter);
  });
});

describe("mergeFilter", () => {
  it("returns header.always if any has it", () => {
    const fa = mergeFilter({}, { header: "always" });
    expect(fa).toMatchInlineSnapshot(`
      {
        "header": "always",
        "logs": [],
        "transactions": [],
        "withdrawals": [],
      }
    `);
    const fb = mergeFilter({ header: "always" }, {});
    expect(fb).toMatchInlineSnapshot(`
      {
        "header": "always",
        "logs": [],
        "transactions": [],
        "withdrawals": [],
      }
    `);
  });

  it("returns an empty header by default", () => {
    const f = mergeFilter({}, {});
    expect(f).toMatchInlineSnapshot(`
      {
        "header": undefined,
        "logs": [],
        "transactions": [],
        "withdrawals": [],
      }
    `);
  });

  it("concatenates logs", () => {
    const f = mergeFilter(
      { logs: [{ address: "0xAAAAAAAAAAAAAAAAAAAAAA" }] },
      { logs: [{ address: "0xBBBBBBBBBBBBBBBBBBBBBB" }] },
    );
    expect(f).toMatchInlineSnapshot(`
      {
        "header": undefined,
        "logs": [
          {
            "address": "0xAAAAAAAAAAAAAAAAAAAAAA",
          },
          {
            "address": "0xBBBBBBBBBBBBBBBBBBBBBB",
          },
        ],
        "transactions": [],
        "withdrawals": [],
      }
    `);
  });

  it("concatenates transactions", () => {
    const f = mergeFilter(
      { transactions: [{ from: "0xAAAAAAAAAAAAAAAAAAAAAA" }] },
      { transactions: [{ from: "0xBBBBBBBBBBBBBBBBBBBBBB" }] },
    );
    expect(f).toMatchInlineSnapshot(`
      {
        "header": undefined,
        "logs": [],
        "transactions": [
          {
            "from": "0xAAAAAAAAAAAAAAAAAAAAAA",
          },
          {
            "from": "0xBBBBBBBBBBBBBBBBBBBBBB",
          },
        ],
        "withdrawals": [],
      }
    `);
  });

  it("concatenates withdrawals", () => {
    const f = mergeFilter(
      { withdrawals: [{ validatorIndex: 1 }] },
      { withdrawals: [{ validatorIndex: 100 }] },
    );
    expect(f).toMatchInlineSnapshot(`
      {
        "header": undefined,
        "logs": [],
        "transactions": [],
        "withdrawals": [
          {
            "validatorIndex": 1,
          },
          {
            "validatorIndex": 100,
          },
        ],
      }
    `);
  });
});
