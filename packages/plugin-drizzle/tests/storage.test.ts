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
          "indexer_id": "indexer_testing_default",
          "n": 1,
          "op": "I",
          "row_id": "1",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000001,
          "indexer_id": "indexer_testing_default",
          "n": 2,
          "op": "I",
          "row_id": "2",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000002,
          "indexer_id": "indexer_testing_default",
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
        plugins: [drizzleStorage({ db, persistState: true })],
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
          "indexer_id": "indexer_testing_default",
          "n": 1,
          "op": "I",
          "row_id": "1",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000001,
          "indexer_id": "indexer_testing_default",
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
          "indexer_id": "indexer_testing_default",
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
        plugins: [drizzleStorage({ db, persistState: true })],
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
          "indexer_id": "indexer_testing_default",
          "n": 1,
          "op": "I",
          "row_id": "1",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000001,
          "indexer_id": "indexer_testing_default",
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
          "indexer_id": "indexer_testing_default",
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
        plugins: [drizzleStorage({ db, persistState: true })],
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
          "indexer_id": "indexer_testing_default",
          "n": 1,
          "op": "I",
          "row_id": "1",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000001,
          "indexer_id": "indexer_testing_default",
          "n": 2,
          "op": "I",
          "row_id": "2",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000002,
          "indexer_id": "indexer_testing_default",
          "n": 3,
          "op": "I",
          "row_id": "3",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000003,
          "indexer_id": "indexer_testing_default",
          "n": 4,
          "op": "I",
          "row_id": "4",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000004,
          "indexer_id": "indexer_testing_default",
          "n": 5,
          "op": "I",
          "row_id": "5",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000004,
          "indexer_id": "indexer_testing_default",
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
          "indexer_id": "indexer_testing_default",
          "n": 7,
          "op": "I",
          "row_id": "6",
          "row_value": null,
          "table_name": "test",
        },
        {
          "cursor": 5000009,
          "indexer_id": "indexer_testing_default",
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
        plugins: [drizzleStorage({ db, persistState: true })],
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

  it("should handle pending data correctly", async () => {
    const db = await getPgliteDb();

    // This test simulates the below scenario:
    // 1. We have a pending block with transactions A, B, C
    // 2. The final accepted block only contains A, C, D, E (B is missing)
    // 3. We want to ensure that transaction B is not in the final table
    const indexer = getMockIndexer({
      override: {
        plugins: [drizzleStorage({ db, persistState: true })],
        async transform({ endCursor, block: { data }, finality }) {
          const { db: tx } = useDrizzleStorage(db);

          // Parse the data to get transactions
          // In our mock, data will be a string like "PENDING_A_B_C" or "ACCEPTED_A_B_C" based on below mock stream
          if (data) {
            // Extract transaction IDs from the data string
            const parts = data.split("_");
            const blockType = parts[0]; // "PENDING" or "ACCEPTED"
            const txIds = parts.slice(1); // ["A", "B", "C"] or ["A", "C", "D", "E"]

            // For each transaction in the block
            for (const txId of txIds) {
              // Insert new transaction
              await tx.insert(testTable).values({
                blockNumber: Number(endCursor?.orderKey),
                key: txId,
                count: txIds.length,
                data: `${blockType}_${txId}`,
              });
            }
          }
        },
      },
    });

    // Create a custom mock client that simulates:
    // 1. A pending block with transactions A, B, C
    // 2. Then the same block number becomes accepted with transactions A, C, D, E (B is missing)
    const mockClient = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
        return [
          // First a pending block with transactions A, B, C
          {
            _tag: "data",
            data: {
              cursor: { orderKey: 5000000n },
              endCursor: { orderKey: 5000001n },
              finality: "pending",
              data: [{ data: "PENDING_A_B_C" }],
              production: "backfill",
            },
          },
          // Then the same block becomes accepted with transactions A, C, D, E (B is missing)
          {
            _tag: "data",
            data: {
              cursor: { orderKey: 5000000n },
              endCursor: { orderKey: 5000001n },
              finality: "accepted",
              data: [{ data: "ACCEPTED_A_C_D_E" }],
              production: "backfill",
            },
          },
        ];
      },
    );

    await run(mockClient, indexer);

    // Query the database to see what transactions were stored
    const result = await db.select().from(testTable);

    // Sort by key for consistent test results
    const sortedResult = result.sort((a, b) =>
      (a.key || "").localeCompare(b.key || ""),
    );

    // We expect to see only transactions from the accepted block (A, C, D, E)
    // with the correct count (4) for each
    expect(
      sortedResult.map(({ id, createdAt, ...r }) => r),
    ).toMatchInlineSnapshot(`
      [
        {
          "blockNumber": 5000001,
          "count": 4,
          "data": "ACCEPTED_A",
          "key": "A",
        },
        {
          "blockNumber": 5000001,
          "count": 4,
          "data": "ACCEPTED_C",
          "key": "C",
        },
        {
          "blockNumber": 5000001,
          "count": 4,
          "data": "ACCEPTED_D",
          "key": "D",
        },
        {
          "blockNumber": 5000001,
          "count": 4,
          "data": "ACCEPTED_E",
          "key": "E",
        },
      ]
    `);

    // Verify that transaction B is not in the final table
    const hasTxB = result.some((row) => row.key === "B");
    expect(hasTxB).toBe(false);

    // Verify that all transactions from the accepted block have count = 4
    const acceptedTxs = result.filter((row) =>
      row.data?.startsWith("ACCEPTED_"),
    );
    expect(acceptedTxs.length).toBe(4); // A, C, D, E
    expect(acceptedTxs.every((row) => row.count === 4)).toBe(true);
  });

  it("should handle multiple pending blocks with updates", async () => {
    const db = await getPgliteDb();

    // This test simulates a more complex scenario:
    // 1. First a pending block with transactions A, B
    // 2. The same pending block updated with transactions A, B, C
    // 3. The same pending block updated again with transactions A, C, D (B removed)
    // 4. Finally the block becomes accepted with transactions A, C, D, E
    // We want to ensure that only the final accepted transactions are in the table

    const indexer = getMockIndexer({
      override: {
        plugins: [drizzleStorage({ db, persistState: true })],
        async transform({ endCursor, block: { data }, finality }) {
          const { db: tx } = useDrizzleStorage(db);
          if (data) {
            // Extract transaction IDs from the data string
            const parts = data.split("_");
            const blockType = parts[0]; // "PENDING" or "ACCEPTED"
            const txIds = parts.slice(1); // Transaction IDs

            // For each transaction in the block
            for (const txId of txIds) {
              // Insert new transaction
              await tx.insert(testTable).values({
                blockNumber: Number(endCursor?.orderKey),
                key: txId,
                count: txIds.length,
                data: `${blockType}_${txId}`,
              });
            }
          }
        },
      },
    });

    // Create a custom mock client that simulates the scenario
    const mockClient = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
        return [
          // First pending block with transactions A, B
          {
            _tag: "data",
            data: {
              cursor: { orderKey: 5000000n },
              endCursor: { orderKey: 5000001n },
              finality: "pending",
              data: [{ data: "PENDING_A_B" }],
              production: "backfill",
            },
          },
          // Same pending block updated with transactions A, B, C
          {
            _tag: "data",
            data: {
              cursor: { orderKey: 5000000n },
              endCursor: { orderKey: 5000001n },
              finality: "pending",
              data: [{ data: "PENDING_A_B_C" }],
              production: "backfill",
            },
          },
          // Same pending block updated again with transactions A, C, D (B removed)
          {
            _tag: "data",
            data: {
              cursor: { orderKey: 5000000n },
              endCursor: { orderKey: 5000001n },
              finality: "pending",
              data: [{ data: "PENDING_A_C_D" }],
              production: "backfill",
            },
          },
          // Finally the block becomes accepted with transactions A, C, D, E
          {
            _tag: "data",
            data: {
              cursor: { orderKey: 5000000n },
              endCursor: { orderKey: 5000001n },
              finality: "accepted",
              data: [{ data: "ACCEPTED_A_C_D_E" }],
              production: "backfill",
            },
          },
        ];
      },
    );

    await run(mockClient, indexer);

    // Query the database to see what transactions were stored
    const result = await db.select().from(testTable);

    // Sort by key for consistent test results
    const sortedResult = result.sort((a, b) =>
      (a.key || "").localeCompare(b.key || ""),
    );

    // We expect to see only transactions from the accepted block (A, C, D, E)
    // with the correct count (4) for each
    expect(
      sortedResult.map(({ id, createdAt, ...r }) => r),
    ).toMatchInlineSnapshot(`
      [
        {
          "blockNumber": 5000001,
          "count": 4,
          "data": "ACCEPTED_A",
          "key": "A",
        },
        {
          "blockNumber": 5000001,
          "count": 4,
          "data": "ACCEPTED_C",
          "key": "C",
        },
        {
          "blockNumber": 5000001,
          "count": 4,
          "data": "ACCEPTED_D",
          "key": "D",
        },
        {
          "blockNumber": 5000001,
          "count": 4,
          "data": "ACCEPTED_E",
          "key": "E",
        },
      ]
    `);

    // Verify that transaction B is not in the final table
    const hasTxB = result.some((row) => row.key === "B");
    expect(hasTxB).toBe(false);

    // Verify that all transactions from the accepted block have count = 4
    const acceptedTxs = result.filter((row) =>
      row.data?.startsWith("ACCEPTED_"),
    );
    expect(acceptedTxs.length).toBe(4); // A, C, D, E
    expect(acceptedTxs.every((row) => row.count === 4)).toBe(true);
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
