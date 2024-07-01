import { MockClient } from "@apibara/protocol/testing";
import { describe, expect, it } from "vitest";
import { run } from "./indexer";
import { generateMockMessages, vcr } from "./testing";
import { type MockRet, getMockIndexer } from "./testing/indexer";

describe("Run Test", () => {
  const client = new MockClient(generateMockMessages(), [{}]);

  it("should stream messages", async () => {
    const sink = vcr<MockRet>();
    await run(client, getMockIndexer(), sink);

    expect(sink.result).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "data": "5000000",
            },
          ],
          "endCursor": {
            "orderKey": 5000000n,
          },
        },
        {
          "data": [
            {
              "data": "5000001",
            },
          ],
          "endCursor": {
            "orderKey": 5000001n,
          },
        },
        {
          "data": [
            {
              "data": "5000002",
            },
          ],
          "endCursor": {
            "orderKey": 5000002n,
          },
        },
        {
          "data": [
            {
              "data": "5000003",
            },
          ],
          "endCursor": {
            "orderKey": 5000003n,
          },
        },
        {
          "data": [
            {
              "data": "5000004",
            },
          ],
          "endCursor": {
            "orderKey": 5000004n,
          },
        },
        {
          "data": [
            {
              "data": "5000005",
            },
          ],
          "endCursor": {
            "orderKey": 5000005n,
          },
        },
        {
          "data": [
            {
              "data": "5000006",
            },
          ],
          "endCursor": {
            "orderKey": 5000006n,
          },
        },
        {
          "data": [
            {
              "data": "5000007",
            },
          ],
          "endCursor": {
            "orderKey": 5000007n,
          },
        },
        {
          "data": [
            {
              "data": "5000008",
            },
          ],
          "endCursor": {
            "orderKey": 5000008n,
          },
        },
        {
          "data": [
            {
              "data": "5000009",
            },
          ],
          "endCursor": {
            "orderKey": 5000009n,
          },
        },
      ]
    `);
  });
});
