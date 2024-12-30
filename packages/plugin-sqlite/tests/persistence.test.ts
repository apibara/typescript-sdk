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
import { sqliteStorage } from "../src";

const indexerName = "test-indexer";
describe("SQLite persistence", () => {
  it("should store the latest block number", async () => {
    const db = new Database(":memory:");

    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(3);
    });

    const indexer = getMockIndexer({
      override: {
        plugins: [sqliteStorage({ database: db, indexerName })],
      },
    });

    await run(client, indexer);

    const rows = db.prepare("SELECT * FROM checkpoints").all();

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "id": "test-indexer",
          "order_key": 5000002,
          "unique_key": null,
        },
      ]
    `);
  });

  it("should store the filters and latest block number (factory mode)", async () => {
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
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 101n },
              endCursor: { orderKey: 102n },
              data: [null, null],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 102n },
              endCursor: { orderKey: 103n },
              data: [{ data: "B" }, null],
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
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 103n },
              endCursor: { orderKey: 104n },
              data: [null, { data: "104B" }],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 104n },
              endCursor: { orderKey: 105n },
              data: [null, { data: "105B" }],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 105n },
              endCursor: { orderKey: 106n },
              data: [{ data: "C" }, { data: "106B" }],
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
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 106n },
              endCursor: { orderKey: 107n },
              data: [null, { data: "107BC" }],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 107n },
              endCursor: { orderKey: 108n },
              data: [null, { data: "108BC" }],
            },
          },
        ];
      }

      return [];
    });

    const indexer = getMockIndexer({
      plugins: [
        sqliteStorage({ database: db, persistState: true, indexerName }),
      ],
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
      },
    });

    await run(client, indexer);

    const checkpointsRows = db.prepare("SELECT * FROM checkpoints").all();
    const filtersRows = db.prepare("SELECT * FROM filters").all();

    expect(checkpointsRows).toMatchInlineSnapshot(`
      [
        {
          "id": "test-indexer",
          "order_key": 108,
          "unique_key": null,
        },
      ]
    `);
    expect(filtersRows).toMatchInlineSnapshot(`
      [
        {
          "filter": "{
      	"filter": "B"
      }",
          "from_block": 103,
          "id": "test-indexer",
          "to_block": 106,
        },
        {
          "filter": "{
      	"filter": "BC"
      }",
          "from_block": 106,
          "id": "test-indexer",
          "to_block": null,
        },
      ]
    `);
  });

  it("should not store the block if the handler throws", async () => {
    const db = new Database(":memory:");

    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(3);
    });

    const indexer = getMockIndexer({
      override: {
        plugins: [sqliteStorage({ database: db, indexerName })],
        async transform({ endCursor }) {
          if (endCursor?.orderKey === 5000002n) {
            throw new Error("test");
          }
        },
      },
    });

    await expect(run(client, indexer)).rejects.toThrow("test");

    const rows = db.prepare("SELECT * FROM checkpoints").all();

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "id": "test-indexer",
          "order_key": 5000001,
          "unique_key": null,
        },
      ]
    `);
  });

  it("should not store the state if it's disabled", async () => {
    const db = new Database(":memory:");

    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(3);
    });

    const indexer = getMockIndexer({
      override: {
        plugins: [
          sqliteStorage({ database: db, persistState: false, indexerName }),
        ],
      },
    });

    await run(client, indexer);

    expect(() => db.prepare("SELECT * FROM checkpoints").all()).toThrow();
  });

  it("should invalidate state (factory mode)", async () => {
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
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 101n },
              endCursor: { orderKey: 102n },
              data: [null, null],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 102n },
              endCursor: { orderKey: 103n },
              data: [{ data: "B" }, null],
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
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 103n },
              endCursor: { orderKey: 104n },
              data: [null, { data: "104B" }],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 104n },
              endCursor: { orderKey: 105n },
              data: [null, { data: "105B" }],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 105n },
              endCursor: { orderKey: 106n },
              data: [{ data: "C" }, { data: "106B" }],
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
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 106n },
              endCursor: { orderKey: 107n },
              data: [null, { data: "107BC" }],
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
      plugins: [
        sqliteStorage({ database: db, persistState: true, indexerName }),
      ],
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
      },
    });

    await run(client, indexer);

    const checkpointsRows = db.prepare("SELECT * FROM checkpoints").all();
    const filtersRows = db.prepare("SELECT * FROM filters").all();

    expect(checkpointsRows).toMatchInlineSnapshot(`
      [
        {
          "id": "test-indexer",
          "order_key": 107,
          "unique_key": null,
        },
      ]
    `);
    expect(filtersRows).toMatchInlineSnapshot(`
      [
        {
          "filter": "{
      	"filter": "B"
      }",
          "from_block": 103,
          "id": "test-indexer",
          "to_block": null,
        },
      ]
    `);
  });

  it("should finalize state (factory mode)", async () => {
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
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 101n },
              endCursor: { orderKey: 102n },
              data: [null, null],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 102n },
              endCursor: { orderKey: 103n },
              data: [{ data: "B" }, null],
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
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 103n },
              endCursor: { orderKey: 104n },
              data: [null, { data: "104B" }],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 104n },
              endCursor: { orderKey: 105n },
              data: [null, { data: "105B" }],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 105n },
              endCursor: { orderKey: 106n },
              data: [{ data: "C" }, { data: "106B" }],
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
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 106n },
              endCursor: { orderKey: 107n },
              data: [null, { data: "107BC" }],
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
      plugins: [
        sqliteStorage({ database: db, persistState: true, indexerName }),
      ],
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
      },
    });

    await run(client, indexer);

    const checkpointsRows = db.prepare("SELECT * FROM checkpoints").all();
    const filtersRows = db.prepare("SELECT * FROM filters").all();

    expect(checkpointsRows).toMatchInlineSnapshot(`
      [
        {
          "id": "test-indexer",
          "order_key": 107,
          "unique_key": null,
        },
      ]
    `);
    expect(filtersRows).toMatchInlineSnapshot(`
      [
        {
          "filter": "{
      	"filter": "BC"
      }",
          "from_block": 106,
          "id": "test-indexer",
          "to_block": null,
        },
      ]
    `);
  });
});