import { describe, expect, it } from "vitest";
import type { MockBlock } from "../proto/testing";
import { MockClient } from "./client";
import type { MockFilter } from "./mock";

describe("MockClient", () => {
  it("returns a stream of messages", async () => {
    const client = new MockClient<MockFilter, MockBlock>(() => {
      return [
        {
          _tag: "data",
          data: {
            finality: "finalized",
            data: [{ data: "hello" }],
            production: "backfill",
            endCursor: {
              orderKey: 5_000_000n,
              uniqueKey: "0x1234567890",
            },
          },
        },
      ];
    });

    const output = [];
    for await (const m of client.streamData({ filter: [] })) {
      output.push(m);
    }

    expect(output).toMatchInlineSnapshot(`
      [
        {
          "_tag": "data",
          "data": {
            "data": [
              {
                "data": "hello",
              },
            ],
            "endCursor": {
              "orderKey": 5000000n,
              "uniqueKey": "0x1234567890",
            },
            "finality": "finalized",
            "production": "backfill",
          },
        },
      ]
    `);
  });

  it("supports factory messages", async () => {
    const client = new MockClient<MockFilter, MockBlock>(() => {
      return [
        {
          _tag: "data",
          data: {
            finality: "finalized",
            data: [{ data: "hello" }, null],
            production: "backfill",
            endCursor: {
              orderKey: 5_000_000n,
              uniqueKey: "0x1234567890",
            },
          },
        },
      ];
    });

    const output = [];
    for await (const m of client.streamData({ filter: [] })) {
      output.push(m);
    }

    expect(output).toMatchInlineSnapshot(`
      [
        {
          "_tag": "data",
          "data": {
            "data": [
              {
                "data": "hello",
              },
              null,
            ],
            "endCursor": {
              "orderKey": 5000000n,
              "uniqueKey": "0x1234567890",
            },
            "finality": "finalized",
            "production": "backfill",
          },
        },
      ]
    `);
  });
});
