import type { Cursor, DataFinality } from "@apibara/protocol";
import {
  type MockBlock,
  MockClient,
  type MockFilter,
} from "@apibara/protocol/testing";
import { describe, expect, it } from "vitest";
import { type IndexerContext, useMessageMetadataContext } from "./context";
import { run } from "./indexer";
import {
  generateMockMessages,
  getMockIndexer,
  mockSink,
  useMockSink,
} from "./internal/testing";

async function transform<TData>({
  block: { data },
}: {
  block: { data?: TData };
  cursor?: Cursor;
  endCursor?: Cursor;
  finality?: DataFinality;
  context: IndexerContext;
}) {
  const { cursor, endCursor, finality } = useMessageMetadataContext();
  const { output } = useMockSink();
  output.push({
    data,
    cursor: cursor?.orderKey,
    endCursor: endCursor?.orderKey,
    finality,
  });
}

describe("Run Test", () => {
  it("should stream messages", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages();
    });

    const output: unknown[] = [];

    const indexer = getMockIndexer({
      override: {
        plugins: [mockSink({ output })],
        transform,
      },
    });

    await run(client, indexer);

    expect(output).toMatchInlineSnapshot(`
      [
        {
          "cursor": 4999999n,
          "data": "5000000",
          "endCursor": 5000000n,
          "finality": "accepted",
        },
        {
          "cursor": 5000000n,
          "data": "5000001",
          "endCursor": 5000001n,
          "finality": "accepted",
        },
        {
          "cursor": 5000001n,
          "data": "5000002",
          "endCursor": 5000002n,
          "finality": "accepted",
        },
        {
          "cursor": 5000002n,
          "data": "5000003",
          "endCursor": 5000003n,
          "finality": "accepted",
        },
        {
          "cursor": 5000003n,
          "data": "5000004",
          "endCursor": 5000004n,
          "finality": "accepted",
        },
        {
          "cursor": 5000004n,
          "data": "5000005",
          "endCursor": 5000005n,
          "finality": "accepted",
        },
        {
          "cursor": 5000005n,
          "data": "5000006",
          "endCursor": 5000006n,
          "finality": "accepted",
        },
        {
          "cursor": 5000006n,
          "data": "5000007",
          "endCursor": 5000007n,
          "finality": "accepted",
        },
        {
          "cursor": 5000007n,
          "data": "5000008",
          "endCursor": 5000008n,
          "finality": "accepted",
        },
        {
          "cursor": 5000008n,
          "data": "5000009",
          "endCursor": 5000009n,
          "finality": "accepted",
        },
      ]
    `);
  });

  it("factory mode: indexer should merge filters and restart when needed", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      const [_factoryFilter, mainFilter] = request.filter;

      if (Object.keys(mainFilter).length === 0) {
        expect(request.startingCursor?.orderKey).toEqual(100n);

        return [
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 100n },
              endCursor: { orderKey: 101n },
              data: [null, null],
              production: "backfill",
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 101n },
              endCursor: { orderKey: 102n },
              data: [null, null],
              production: "backfill",
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 102n },
              endCursor: { orderKey: 103n },
              data: [{ data: "B" }, null],
              production: "backfill",
            },
          },
        ];
      }

      if (mainFilter.filter === "B") {
        expect(request.startingCursor?.orderKey).toEqual(102n);

        return [
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 102n },
              endCursor: { orderKey: 103n },
              data: [{ data: "B" }, { data: "103B" }],
              production: "backfill",
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 103n },
              endCursor: { orderKey: 104n },
              data: [null, { data: "104B" }],
              production: "backfill",
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 104n },
              endCursor: { orderKey: 105n },
              data: [null, { data: "105B" }],
              production: "backfill",
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 105n },
              endCursor: { orderKey: 106n },
              data: [{ data: "C" }, { data: "106B" }],
              production: "backfill",
            },
          },
        ];
      }

      if (mainFilter.filter === "BC") {
        expect(request.startingCursor?.orderKey).toEqual(105n);

        return [
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 105n },
              endCursor: { orderKey: 106n },
              data: [{ data: "C" }, { data: "106BC" }],
              production: "backfill",
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 106n },
              endCursor: { orderKey: 107n },
              data: [null, { data: "107BC" }],
              production: "backfill",
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 107n },
              endCursor: { orderKey: 108n },
              data: [null, { data: "108BC" }],
              production: "backfill",
            },
          },
        ];
      }

      return [];
    });

    const output: unknown[] = [];
    const metadata: Record<string, unknown> = {};

    const indexer = getMockIndexer({
      override: {
        plugins: [mockSink({ output, metadata })],
        startingCursor: { orderKey: 100n },
        factory: async ({ block }) => {
          if (block.data === "B") {
            return { filter: { filter: "B" } };
          }

          if (block.data === "C") {
            return { filter: { filter: "C" } };
          }

          return {};
        },
        transform,
      },
    });

    await run(client, indexer);

    expect((metadata.lastCursor as Cursor).orderKey).toEqual(108n);
    expect((metadata.lastFilter as { filter: unknown }).filter).toEqual("BC");

    expect(output).toMatchInlineSnapshot(`
      [
        {
          "cursor": 102n,
          "data": "103B",
          "endCursor": 103n,
          "finality": "accepted",
        },
        {
          "cursor": 103n,
          "data": "104B",
          "endCursor": 104n,
          "finality": "accepted",
        },
        {
          "cursor": 104n,
          "data": "105B",
          "endCursor": 105n,
          "finality": "accepted",
        },
        {
          "cursor": 105n,
          "data": "106BC",
          "endCursor": 106n,
          "finality": "accepted",
        },
        {
          "cursor": 106n,
          "data": "107BC",
          "endCursor": 107n,
          "finality": "accepted",
        },
        {
          "cursor": 107n,
          "data": "108BC",
          "endCursor": 108n,
          "finality": "accepted",
        },
      ]
    `);
  });

  it("factory mode: last cursor should persist when error is thrown in indexer", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      const [_factoryFilter, mainFilter] = request.filter;

      if (Object.keys(mainFilter).length === 0) {
        expect(request.startingCursor?.orderKey).toEqual(100n);

        return [
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 100n },
              endCursor: { orderKey: 101n },
              data: [null, null],
              production: "backfill",
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 101n },
              endCursor: { orderKey: 102n },
              data: [null, null],
              production: "backfill",
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 102n },
              endCursor: { orderKey: 103n },
              data: [{ data: "B" }, null],
              production: "backfill",
            },
          },
          Error("this error should not occurr!"),
        ];
      }

      if (mainFilter.filter === "B") {
        expect(request.startingCursor?.orderKey).toEqual(102n);

        return [
          Error("this error should occurr!"),
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 103n },
              endCursor: { orderKey: 104n },
              data: [null, { data: "104B" }],
              production: "backfill",
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 104n },
              endCursor: { orderKey: 105n },
              data: [null, { data: "105B" }],
              production: "backfill",
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 105n },
              endCursor: { orderKey: 106n },
              data: [{ data: "C" }, { data: "106B" }],
              production: "backfill",
            },
          },
        ];
      }

      return [];
    });

    const output: unknown[] = [];
    const metadata: Record<string, unknown> = {};

    const indexer = getMockIndexer({
      override: {
        plugins: [mockSink({ output, metadata })],
        startingCursor: { orderKey: 100n },
        factory: async ({ block }) => {
          if (block.data === "B") {
            return { filter: { filter: "B" } };
          }

          if (block.data === "C") {
            return { filter: { filter: "C" } };
          }

          return {};
        },
        transform,
      },
    });

    await expect(() => run(client, indexer)).rejects.toThrowError(
      "this error should occurr!",
    );

    expect((metadata.lastCursor as Cursor).orderKey).toEqual(103n);
    expect((metadata.lastFilter as { filter: unknown }).filter).toEqual("B");

    expect(output).toMatchInlineSnapshot("[]");
  });
});
