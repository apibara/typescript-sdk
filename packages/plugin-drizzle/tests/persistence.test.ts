import { run } from "@apibara/indexer";
import {
  generateMockMessages,
  getMockIndexer,
} from "@apibara/indexer/internal/testing";
import type { Finalize, Invalidate } from "@apibara/protocol";
import {
  type MockBlock,
  MockClient,
  type MockFilter,
} from "@apibara/protocol/testing";
import { describe, expect, it } from "vitest";
import { drizzleStorage, useDrizzleStorage } from "../src";
import { checkpoints, filters, schemaVersion } from "../src/persistence";
import { reorgRollbackTable } from "../src/storage";
import { getPgliteDb, testTable } from "./helper";

describe("Drizzle persistence", () => {
  it("should persist state", async () => {
    const db = await getPgliteDb();

    const indexer = getMockIndexer({
      override: {
        plugins: [drizzleStorage({ db, persistState: true })],
        async transform({ endCursor, block: { data } }) {
          const { db: tx } = useDrizzleStorage(db);

          const rows = await tx.select().from(testTable);

          await tx.insert(testTable).values({
            blockNumber: Number(endCursor?.orderKey),
            count: rows.length,
            data,
          });

          if (endCursor?.orderKey === 5000006n) {
            throw new Error("Intentional error to test persistence");
          }
        },
      },
    });

    const mockClient = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
        return generateMockMessages(10);
      },
    );

    await expect(run(mockClient, indexer)).rejects.toThrow(
      "Failed to run handler:middleware",
    );

    const result = (await db.select().from(testTable)).sort(
      (a, b) => a.blockNumber - b.blockNumber,
    );
    const checkpointsResult = await db.select().from(checkpoints);

    expect(result).toHaveLength(6);
    expect(result[result.length - 1].blockNumber).toBe(5000005);
    expect(checkpointsResult).toMatchInlineSnapshot(`
      [
        {
          "id": "indexer_testing_default",
          "orderKey": 5000005,
          "uniqueKey": null,
        },
      ]
    `);
  });

  it("should override the persisted uniqueKey", async () => {
    const db = await getPgliteDb();

    const indexer = getMockIndexer({
      override: {
        plugins: [drizzleStorage({ db, persistState: true })],
        async transform({ endCursor, block: { data } }) {},
      },
    });

    const mockClient = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
        return generateMockMessages(10, {
          uniqueKey: true,
          baseBlockNumber: 1_000_000n,
        });
      },
    );

    await run(mockClient, indexer);

    expect(await db.select().from(checkpoints)).toMatchInlineSnapshot(`
      [
        {
          "id": "indexer_testing_default",
          "orderKey": 1000009,
          "uniqueKey": "0xff001000009",
        },
      ]
    `);

    const mockClient2 = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
        return generateMockMessages(10, {
          uniqueKey: false,
          baseBlockNumber: 1_000_010n,
        });
      },
    );

    await run(mockClient2, indexer);

    expect(await db.select().from(checkpoints)).toMatchInlineSnapshot(`
      [
        {
          "id": "indexer_testing_default",
          "orderKey": 1000019,
          "uniqueKey": null,
        },
      ]
    `);
  });

  it("should persist the filters and latest block number (factory mode)", async () => {
    const db = await getPgliteDb();

    const mockClient = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
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
      },
    );

    const indexer = getMockIndexer({
      override: {
        plugins: [drizzleStorage({ db, persistState: true })],
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

    await run(mockClient, indexer);

    const checkpointsResult = await db.select().from(checkpoints);
    const filtersResult = await db.select().from(filters);

    expect(checkpointsResult).toMatchInlineSnapshot(`
      [
        {
          "id": "indexer_testing_default",
          "orderKey": 108,
          "uniqueKey": null,
        },
      ]
    `);
    expect(filtersResult).toMatchInlineSnapshot(`
      [
        {
          "filter": "{
      	"filter": "B"
      }",
          "fromBlock": 103,
          "id": "indexer_testing_default",
          "toBlock": 106,
        },
        {
          "filter": "{
      	"filter": "BC"
      }",
          "fromBlock": 106,
          "id": "indexer_testing_default",
          "toBlock": null,
        },
      ]
    `);
  });

  it("should invalidate state (factory mode)", async () => {
    const db = await getPgliteDb();

    const mockClient = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
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
      },
    );

    const indexer = getMockIndexer({
      override: {
        plugins: [drizzleStorage({ db, persistState: true })],
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

    await run(mockClient, indexer);

    const checkpointsResult = await db.select().from(checkpoints);
    const filtersResult = await db.select().from(filters);

    expect(checkpointsResult).toMatchInlineSnapshot(`
      [
        {
          "id": "indexer_testing_default",
          "orderKey": 107,
          "uniqueKey": null,
        },
      ]
    `);
    expect(filtersResult).toMatchInlineSnapshot(`
      [
        {
          "filter": "{
      	"filter": "B"
      }",
          "fromBlock": 103,
          "id": "indexer_testing_default",
          "toBlock": null,
        },
      ]
    `);
  });

  it("should finalize state (factory mode)", async () => {
    const db = await getPgliteDb();

    const mockClient = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
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
      },
    );

    const indexer = getMockIndexer({
      override: {
        plugins: [drizzleStorage({ db, persistState: true })],
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

    await run(mockClient, indexer);

    const checkpointsResult = await db.select().from(checkpoints);
    const filtersResult = await db.select().from(filters);

    expect(checkpointsResult).toMatchInlineSnapshot(`
      [
        {
          "id": "indexer_testing_default",
          "orderKey": 107,
          "uniqueKey": null,
        },
      ]
    `);
    expect(filtersResult).toMatchInlineSnapshot(`
      [
        {
          "filter": "{
      	"filter": "BC"
      }",
          "fromBlock": 106,
          "id": "indexer_testing_default",
          "toBlock": null,
        },
      ]
    `);
  });

  it("persistence schema version check ", async () => {
    const db = await getPgliteDb();

    const indexer = getMockIndexer({
      override: {
        plugins: [drizzleStorage({ db, persistState: true })],
        async transform({ endCursor, block: { data } }) {
          const { db: tx } = useDrizzleStorage(db);

          const rows = await tx.select().from(testTable);

          await tx.insert(testTable).values({
            blockNumber: Number(endCursor?.orderKey),
            count: rows.length,
            data,
          });
        },
      },
    });

    const mockClient = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
        return generateMockMessages(3);
      },
    );

    await run(mockClient, indexer);

    const rows = await db.select().from(schemaVersion);

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "k": 0,
          "version": 0,
        },
      ]
    `);
  });

  it("should not persist state for pending blocks", async () => {
    const db = await getPgliteDb();
    // This test verifies that state is not persisted for pending blocks
    // and that the checkpoint only advances for accepted blocks

    const indexer = getMockIndexer({
      override: {
        plugins: [drizzleStorage({ db, persistState: true })],
        async transform({ endCursor, block: { data }, finality }) {
          const { db: tx } = useDrizzleStorage(db);

          // Insert a record for each block
          await tx.insert(testTable).values({
            blockNumber: Number(endCursor?.orderKey),
            key: `block_${Number(endCursor?.orderKey)}`,
            count: 1,
            data: `${finality}_${data}`,
          });
        },
      },
    });

    // Create a mock client that alternates between pending and accepted blocks
    const mockClient = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
        return [
          // Block 1: Pending
          {
            _tag: "data",
            data: {
              cursor: { orderKey: 5000000n },
              endCursor: { orderKey: 5000001n },
              finality: "pending",
              data: [{ data: "block1" }],
              production: "backfill",
            },
          },
          // Block 1: Accepted
          {
            _tag: "data",
            data: {
              cursor: { orderKey: 5000000n },
              endCursor: { orderKey: 5000001n },
              finality: "accepted",
              data: [{ data: "block1" }],
              production: "backfill",
            },
          },
          // Block 2: Pending
          {
            _tag: "data",
            data: {
              cursor: { orderKey: 5000001n },
              endCursor: { orderKey: 5000002n },
              finality: "pending",
              data: [{ data: "block2" }],
              production: "backfill",
            },
          },
          // Block 2: Accepted
          {
            _tag: "data",
            data: {
              cursor: { orderKey: 5000001n },
              endCursor: { orderKey: 5000002n },
              finality: "accepted",
              data: [{ data: "block2" }],
              production: "backfill",
            },
          },
          // Block 3: Pending
          {
            _tag: "data",
            data: {
              cursor: { orderKey: 5000002n },
              endCursor: { orderKey: 5000003n },
              finality: "pending",
              data: [{ data: "block3" }],
              production: "backfill",
            },
          },
        ];
      },
    );

    await run(mockClient, indexer);

    // Check the database records
    const result = await db.select().from(testTable);

    // data is invalidated before each transform if the prev block was pending
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "blockNumber": 5000001,
          "count": 1,
          "createdAt": null,
          "data": "accepted_block1",
          "id": 2,
          "key": "block_5000001",
        },
        {
          "blockNumber": 5000002,
          "count": 1,
          "createdAt": null,
          "data": "accepted_block2",
          "id": 4,
          "key": "block_5000002",
        },
        {
          "blockNumber": 5000003,
          "count": 1,
          "createdAt": null,
          "data": "pending_block3",
          "id": 5,
          "key": "block_5000003",
        },
      ]
    `);

    // Check the checkpoints table
    const checkpointsResult = await db.select().from(checkpoints);

    // should only have non-pending blocks in the checkpoint
    expect(checkpointsResult).toMatchInlineSnapshot(`
      [
        {
          "id": "indexer_testing_default",
          "orderKey": 5000002,
          "uniqueKey": null,
        },
      ]
    `);

    // The checkpoint should be at block 2, which is the last accepted block
    expect(checkpointsResult[0].orderKey).toBe(5000002);

    // Check the rollback table - it should have entries for all blocks
    const rollbackResult = await db.select().from(reorgRollbackTable);

    // Verify that we have the correct number of operations in the rollback table
    expect(rollbackResult.length).toBe(3); // 3 as last pending ones are invalidated
  });
});
