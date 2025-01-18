import { run } from "@apibara/indexer";
import {
  generateMockMessages,
  getMockIndexer,
} from "@apibara/indexer/internal";
import {
  type MockBlock,
  MockClient,
  type MockFilter,
} from "@apibara/protocol/testing";
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

import type { Finalize, Invalidate } from "@apibara/protocol";
import { sqliteStorage, useSqliteKeyValueStore } from "../src";

describe("SQLite key-value store", () => {
  it("should be able to store and retrieve values", async () => {
    const db = new Database(":memory:");

    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(3);
    });

    const indexer = getMockIndexer({
      override: {
        plugins: [sqliteStorage({ database: db })],
        async transform({ block: { data }, endCursor }) {
          const blockNumber = Number(endCursor?.orderKey ?? 0);

          const kv = useSqliteKeyValueStore();

          kv.put(`data-${blockNumber}`, data);
          kv.del(`data-${blockNumber - 1}`);

          const prev = kv.get("latest");
          if (prev !== undefined) {
            expect(prev).toBe(blockNumber - 1);
          }

          kv.put("latest", blockNumber);
        },
      },
    });

    await run(client, indexer);

    const rows = db.prepare("SELECT * FROM kvs").all();
    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "from_block": 5000000,
          "k": "data-5000000",
          "to_block": 5000001,
          "v": ""5000000"",
        },
        {
          "from_block": 5000000,
          "k": "latest",
          "to_block": 5000001,
          "v": "5000000",
        },
        {
          "from_block": 5000001,
          "k": "data-5000001",
          "to_block": 5000002,
          "v": ""5000001"",
        },
        {
          "from_block": 5000001,
          "k": "latest",
          "to_block": 5000002,
          "v": "5000001",
        },
        {
          "from_block": 5000002,
          "k": "data-5000002",
          "to_block": null,
          "v": ""5000002"",
        },
        {
          "from_block": 5000002,
          "k": "latest",
          "to_block": null,
          "v": "5000002",
        },
      ]
    `);
  });

  it("should throw if the key-value store is not enabled", async () => {
    const db = new Database(":memory:");

    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(3);
    });

    const indexer = getMockIndexer({
      override: {
        plugins: [sqliteStorage({ database: db, keyValueStore: false })],
        async transform(_args) {
          const _kv = useSqliteKeyValueStore();
        },
      },
    });

    await expect(run(client, indexer)).rejects.toThrow();
  });

  it("should invalidate kv store (factory mode)", async () => {
    const db = new Database(":memory:");

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
            _tag: "invalidate",
            invalidate: {
              cursor: {
                orderKey: 105n,
              },
            },
          } as Invalidate,
        ];
      }

      return [];
    });

    const indexer = getMockIndexer({
      plugins: [sqliteStorage({ database: db, keyValueStore: true })],
      override: {
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
        transform: async ({ block }) => {
          const kv = useSqliteKeyValueStore();
          kv.put(`data-${block.data}`, block.data);
        },
      },
    });

    await run(client, indexer);

    const rows = db.prepare("SELECT * FROM kvs").all();

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "from_block": 103,
          "k": "data-103B",
          "to_block": null,
          "v": ""103B"",
        },
        {
          "from_block": 104,
          "k": "data-104B",
          "to_block": null,
          "v": ""104B"",
        },
        {
          "from_block": 105,
          "k": "data-105B",
          "to_block": null,
          "v": ""105B"",
        },
      ]
    `);
  });

  it("should finalize kv store (factory mode)", async () => {
    const db = new Database(":memory:");

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
            _tag: "finalize",
            finalize: {
              cursor: {
                orderKey: 107n,
              },
            },
          } as Finalize,
        ];
      }

      return [];
    });

    const indexer = getMockIndexer({
      plugins: [sqliteStorage({ database: db, keyValueStore: true })],
      override: {
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
        transform: async ({ block, endCursor }) => {
          const kv = useSqliteKeyValueStore();
          kv.put(`data-${endCursor?.orderKey}`, block.data);

          if (endCursor?.orderKey && endCursor?.orderKey === 106n) {
            kv.del(`data-${endCursor.orderKey - 1n}`);
          }
        },
      },
    });

    await run(client, indexer);

    const rows = db.prepare("SELECT * FROM kvs").all();

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "from_block": 103,
          "k": "data-103",
          "to_block": null,
          "v": ""103B"",
        },
        {
          "from_block": 104,
          "k": "data-104",
          "to_block": null,
          "v": ""104B"",
        },
        {
          "from_block": 106,
          "k": "data-106",
          "to_block": null,
          "v": ""106BC"",
        },
        {
          "from_block": 107,
          "k": "data-107",
          "to_block": null,
          "v": ""107BC"",
        },
      ]
    `);
  });
});
