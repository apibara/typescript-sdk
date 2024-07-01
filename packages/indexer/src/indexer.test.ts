import { MockClient } from "@apibara/protocol/testing";
import { describe, expect, it } from "vitest";
import { run } from "./indexer";
import { generateMockMessages, vcr } from "./testing";
import { type MockRet, getMockIndexer } from "./testing/indexer";

describe("Run Test", () => {
  const client = new MockClient(messages, [{}]);

  it("should stream messages", async () => {
    const sink = vcr<MockRet>();
    await run(client, getMockIndexer(), sink);

    expect(sink.result).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "blockNumber": 5000000,
            },
          ],
          "endCursor": {
            "orderKey": 5000000n,
          },
        },
        {
          "data": [
            {
              "blockNumber": 5000001,
            },
          ],
          "endCursor": {
            "orderKey": 5000001n,
          },
        },
        {
          "data": [
            {
              "blockNumber": 5000002,
            },
          ],
          "endCursor": {
            "orderKey": 5000002n,
          },
        },
        {
          "data": [
            {
              "blockNumber": 5000003,
            },
          ],
          "endCursor": {
            "orderKey": 5000003n,
          },
        },
        {
          "data": [
            {
              "blockNumber": 5000004,
            },
          ],
          "endCursor": {
            "orderKey": 5000004n,
          },
        },
        {
          "data": [
            {
              "blockNumber": 5000005,
            },
          ],
          "endCursor": {
            "orderKey": 5000005n,
          },
        },
        {
          "data": [
            {
              "blockNumber": 5000006,
            },
          ],
          "endCursor": {
            "orderKey": 5000006n,
          },
        },
        {
          "data": [
            {
              "blockNumber": 5000007,
            },
          ],
          "endCursor": {
            "orderKey": 5000007n,
          },
        },
        {
          "data": [
            {
              "blockNumber": 5000008,
            },
          ],
          "endCursor": {
            "orderKey": 5000008n,
          },
        },
        {
          "data": [
            {
              "blockNumber": 5000009,
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

const messages = generateMockMessages();
