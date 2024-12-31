import { run } from "@apibara/indexer";
import {
  generateMockMessages,
  getMockIndexer,
} from "@apibara/indexer/internal";
import type { Finalize, Invalidate } from "@apibara/protocol";
import {
  type MockBlock,
  MockClient,
  type MockFilter,
} from "@apibara/protocol/testing";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { drizzleStorage, useDrizzleStorage } from "../src";
import { checkpoints, filters, schemaVersion } from "../src/persistence";
import { reorgRollbackTable } from "../src/storage";
import { getPgliteDb, testTable } from "./helper";

describe("Drizzle test", () => {
  it("should store data along with audit", async () => {
    const db = await getPgliteDb();

    const indexer = getMockIndexer({
      override: {
        plugins: [
          drizzleStorage({ db, persistState: true, indexerName: "testing" }),
        ],
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

    const result = await db.select().from(testTable);
    const rollBackResult = await db.select().from(reorgRollbackTable);

    expect(result.map(({ createdAt, ...r }) => r)).toMatchInlineSnapshot(`
      [
        {
          "blockNumber": 5000000,
          "count": 0,
          "data": "5000000",
          "id": 1,
          "key": null,
        },
        {
          "blockNumber": 5000001,
          "count": 1,
          "data": "5000001",
          "id": 2,
          "key": null,
        },
        {
          "blockNumber": 5000002,
          "count": 2,
          "data": "5000002",
          "id": 3,
          "key": null,
        },
      ]
    `);
    expect(rollBackResult).toMatchInlineSnapshot(`
      [
        {
          "cursor": 5000000,
          "n": 1,
          "op": "I",
          "row_id": "1",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000001,
          "n": 2,
          "op": "I",
          "row_id": "2",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000002,
          "n": 3,
          "op": "I",
          "row_id": "3",
          "row_value": null,
          "table_name": "test",
        },
      ]
    `);
  });

  it("should update data along with audit", async () => {
    const db = await getPgliteDb();

    const indexer = getMockIndexer({
      override: {
        plugins: [
          drizzleStorage({ db, persistState: true, indexerName: "testing" }),
        ],
        async transform({ endCursor, block: { data } }) {
          const { db: tx } = useDrizzleStorage(db);

          const rows = await tx.select().from(testTable);

          const result = await tx
            .update(testTable)
            .set({
              blockNumber: Number(endCursor?.orderKey),
              count: rows.length,
            })
            .where(eq(testTable.key, "abc"))
            .returning();

          if (result.length === 0) {
            await tx.insert(testTable).values({
              blockNumber: Number(endCursor?.orderKey),
              count: rows.length,
              data,
              key: "abc",
            });
          }
        },
      },
    });

    const mockClient = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
        return generateMockMessages(3);
      },
    );

    await run(mockClient, indexer);

    const result = await db.select().from(testTable);
    const rollBackResult = await db.select().from(reorgRollbackTable);

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "blockNumber": 5000002,
          "count": 1,
          "createdAt": null,
          "data": "5000000",
          "id": 1,
          "key": "abc",
        },
      ]
    `);
    expect(rollBackResult).toMatchInlineSnapshot(`
      [
        {
          "cursor": 5000000,
          "n": 1,
          "op": "I",
          "row_id": "1",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000001,
          "n": 2,
          "op": "U",
          "row_id": "1",
          "row_value": {
            "block_number": 5000000,
            "count": 0,
            "created_at": null,
            "data": "5000000",
            "id": 1,
            "key": "abc",
          },
          "table_name": "test",
        },
        {
          "cursor": 5000002,
          "n": 3,
          "op": "U",
          "row_id": "1",
          "row_value": {
            "block_number": 5000001,
            "count": 1,
            "created_at": null,
            "data": "5000000",
            "id": 1,
            "key": "abc",
          },
          "table_name": "test",
        },
      ]
    `);
  });

  it("should delete data along with audit", async () => {
    const db = await getPgliteDb();

    const indexer = getMockIndexer({
      override: {
        plugins: [
          drizzleStorage({ db, persistState: true, indexerName: "testing" }),
        ],
        async transform({ endCursor, block: { data } }) {
          const { db: tx } = useDrizzleStorage(db);

          const value = await tx
            .select()
            .from(testTable)
            .where(eq(testTable.key, "abc"))
            .limit(1);

          if (value.length !== 0) {
            await tx.delete(testTable).where(eq(testTable.key, "abc"));
          } else {
            await tx.insert(testTable).values({
              blockNumber: Number(endCursor?.orderKey),
              key: "abc",
            });
          }
        },
      },
    });

    const mockClient = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
        return generateMockMessages(3);
      },
    );

    await run(mockClient, indexer);

    const result = await db.select().from(testTable);
    const rollBackResult = await db.select().from(reorgRollbackTable);

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "blockNumber": 5000002,
          "count": null,
          "createdAt": null,
          "data": null,
          "id": 2,
          "key": "abc",
        },
      ]
    `);
    expect(rollBackResult).toMatchInlineSnapshot(`
      [
        {
          "cursor": 5000000,
          "n": 1,
          "op": "I",
          "row_id": "1",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000001,
          "n": 2,
          "op": "D",
          "row_id": "1",
          "row_value": {
            "block_number": 5000000,
            "count": null,
            "created_at": null,
            "data": null,
            "id": 1,
            "key": "abc",
          },
          "table_name": "test",
        },
        {
          "cursor": 5000002,
          "n": 3,
          "op": "I",
          "row_id": "2",
          "row_value": null,
          "table_name": "test",
        },
      ]
    `);
  });

  it("should invalidate data", async () => {
    const db = await getPgliteDb();

    const indexer = getMockIndexer({
      override: {
        plugins: [
          drizzleStorage({ db, persistState: true, indexerName: "testing" }),
        ],
        async transform({ endCursor, block: { data } }) {
          const { db: tx } = useDrizzleStorage(db);

          const rows = await tx.select().from(testTable);

          await tx.insert(testTable).values({
            blockNumber: Number(endCursor?.orderKey),
            count: rows.length,
            data,
            // non changing date
            createdAt: new Date("2025-01-01"),
          });

          if (Number(endCursor?.orderKey) === 5000004) {
            await tx
              .update(testTable)
              .set({
                count: rows.length,
                data: "INSERTED AND UPDATED AT 5000004",
              })
              .where(eq(testTable.blockNumber, 5000004));
          }

          if (Number(endCursor?.orderKey) === 5000007) {
            // operations after invalidation cursor which are supposed to be undone
            await tx
              .delete(testTable)
              .where(eq(testTable.blockNumber, 5000002));

            await tx.insert(testTable).values({
              blockNumber: 5000008,
              count: rows.length,
              data: "ARTIFICIAL BLOCK",
            });

            await tx
              .update(testTable)
              .set({
                count: rows.length,
                data: "UPDATED AT 5000007",
              })
              .where(eq(testTable.blockNumber, 5000003));
          }
        },
      },
    });

    const mockClient = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
        return generateMockMessages(10, {
          // we invalidate at 9th (second last and index 8) message
          // and we invalidate cursor 5000006 (6th message and index 5)
          invalidate: { invalidateTriggerIndex: 8, invalidateFromIndex: 5 },
        });
      },
    );

    await run(mockClient, indexer);

    const result = await db.select().from(testTable);
    const rollBackResult = await db.select().from(reorgRollbackTable);

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "blockNumber": 5000000,
          "count": 0,
          "createdAt": 2025-01-01T00:00:00.000Z,
          "data": "5000000",
          "id": 1,
          "key": null,
        },
        {
          "blockNumber": 5000001,
          "count": 1,
          "createdAt": 2025-01-01T00:00:00.000Z,
          "data": "5000001",
          "id": 2,
          "key": null,
        },
        {
          "blockNumber": 5000004,
          "count": 4,
          "createdAt": 2025-01-01T00:00:00.000Z,
          "data": "INSERTED AND UPDATED AT 5000004",
          "id": 5,
          "key": null,
        },
        {
          "blockNumber": 5000005,
          "count": 5,
          "createdAt": 2025-01-01T00:00:00.000Z,
          "data": "5000005",
          "id": 6,
          "key": null,
        },
        {
          "blockNumber": 5000003,
          "count": 3,
          "createdAt": 2025-01-01T00:00:00.000Z,
          "data": "5000003",
          "id": 4,
          "key": null,
        },
        {
          "blockNumber": 5000002,
          "count": 2,
          "createdAt": 2025-01-01T00:00:00.000Z,
          "data": "5000002",
          "id": 3,
          "key": null,
        },
        {
          "blockNumber": 5000009,
          "count": 6,
          "createdAt": 2025-01-01T00:00:00.000Z,
          "data": "5000009",
          "id": 10,
          "key": null,
        },
      ]
    `);
    expect(rollBackResult).toMatchInlineSnapshot(`
      [
        {
          "cursor": 5000000,
          "n": 1,
          "op": "I",
          "row_id": "1",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000001,
          "n": 2,
          "op": "I",
          "row_id": "2",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000002,
          "n": 3,
          "op": "I",
          "row_id": "3",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000003,
          "n": 4,
          "op": "I",
          "row_id": "4",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000004,
          "n": 5,
          "op": "I",
          "row_id": "5",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000004,
          "n": 6,
          "op": "U",
          "row_id": "5",
          "row_value": {
            "block_number": 5000004,
            "count": 4,
            "created_at": "2025-01-01T00:00:00",
            "data": "5000004",
            "id": 5,
            "key": null,
          },
          "table_name": "test",
        },
        {
          "cursor": 5000005,
          "n": 7,
          "op": "I",
          "row_id": "6",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000009,
          "n": 13,
          "op": "I",
          "row_id": "10",
          "row_value": null,
          "table_name": "test",
        },
      ]
    `);
  });

  it("should finalize data", async () => {
    // Same test as invalidate just we finalize at the end
    const db = await getPgliteDb();

    const indexer = getMockIndexer({
      override: {
        plugins: [
          drizzleStorage({ db, persistState: true, indexerName: "testing" }),
        ],
        async transform({ endCursor, block: { data } }) {
          const { db: tx } = useDrizzleStorage(db);

          const rows = await tx.select().from(testTable);

          await tx.insert(testTable).values({
            blockNumber: Number(endCursor?.orderKey),
            count: rows.length,
            data,
          });

          if (Number(endCursor?.orderKey) === 5000004) {
            await tx
              .update(testTable)
              .set({
                count: rows.length,
                data: "INSERTED AND UPDATED AT 5000004",
              })
              .where(eq(testTable.blockNumber, 5000004));
          }

          if (Number(endCursor?.orderKey) === 5000007) {
            // operations after invalidation cursor which are supposed to be undone
            await tx
              .delete(testTable)
              .where(eq(testTable.blockNumber, 5000002));

            await tx.insert(testTable).values({
              blockNumber: 5000008,
              count: rows.length,
              data: "ARTIFICIAL BLOCK",
            });

            await tx
              .update(testTable)
              .set({
                count: rows.length,
                data: "UPDATED AT 5000007",
              })
              .where(eq(testTable.blockNumber, 5000003));
          }
        },
      },
    });

    const mockClient = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
        return generateMockMessages(10, {
          // we invalidate at 9th (second last and index 8) message
          // and we invalidate cursor 5000006 (6th message and index 5)
          invalidate: { invalidateTriggerIndex: 8, invalidateFromIndex: 5 },
          finalize: { finalizeTriggerIndex: 9, finalizeToIndex: 9 },
        });
      },
    );

    await run(mockClient, indexer);

    const result = await db.select().from(testTable);
    const rollBackResult = await db.select().from(reorgRollbackTable);

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "blockNumber": 5000000,
          "count": 0,
          "createdAt": null,
          "data": "5000000",
          "id": 1,
          "key": null,
        },
        {
          "blockNumber": 5000001,
          "count": 1,
          "createdAt": null,
          "data": "5000001",
          "id": 2,
          "key": null,
        },
        {
          "blockNumber": 5000004,
          "count": 4,
          "createdAt": null,
          "data": "INSERTED AND UPDATED AT 5000004",
          "id": 5,
          "key": null,
        },
        {
          "blockNumber": 5000005,
          "count": 5,
          "createdAt": null,
          "data": "5000005",
          "id": 6,
          "key": null,
        },
        {
          "blockNumber": 5000003,
          "count": 3,
          "createdAt": null,
          "data": "5000003",
          "id": 4,
          "key": null,
        },
        {
          "blockNumber": 5000002,
          "count": 2,
          "createdAt": null,
          "data": "5000002",
          "id": 3,
          "key": null,
        },
      ]
    `);
    expect(rollBackResult).toMatchInlineSnapshot("[]");
  });

  it("should persist state", async () => {
    const db = await getPgliteDb();

    const indexer = getMockIndexer({
      override: {
        plugins: [
          drizzleStorage({ db, persistState: true, indexerName: "testing" }),
        ],
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
          "id": "testing",
          "orderKey": 5000005,
          "uniqueKey": "",
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
      },
    );

    const indexer = getMockIndexer({
      override: {
        plugins: [
          drizzleStorage({ db, persistState: true, indexerName: "testing" }),
        ],
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
          "id": "testing",
          "orderKey": 108,
          "uniqueKey": "",
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
          "id": "testing",
          "toBlock": 106,
        },
        {
          "filter": "{
      	"filter": "BC"
      }",
          "fromBlock": 106,
          "id": "testing",
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
      },
    );

    const indexer = getMockIndexer({
      override: {
        plugins: [
          drizzleStorage({ db, persistState: true, indexerName: "testing" }),
        ],
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
          "id": "testing",
          "orderKey": 107,
          "uniqueKey": "",
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
          "id": "testing",
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
      },
    );

    const indexer = getMockIndexer({
      override: {
        plugins: [
          drizzleStorage({ db, persistState: true, indexerName: "testing" }),
        ],
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
          "id": "testing",
          "orderKey": 107,
          "uniqueKey": "",
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
          "id": "testing",
          "toBlock": null,
        },
      ]
    `);
  });

  it("persistence schema version check ", async () => {
    const db = await getPgliteDb();

    const indexer = getMockIndexer({
      override: {
        plugins: [
          drizzleStorage({ db, persistState: true, indexerName: "testing" }),
        ],
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
});
