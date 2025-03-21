import { run } from "@apibara/indexer";
import {
  generateMockMessages,
  getMockIndexer,
} from "@apibara/indexer/internal/testing";
import {
  type MockBlock,
  MockClient,
  type MockFilter,
} from "@apibara/protocol/testing";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { drizzleStorage, useDrizzleStorage } from "../src";
import { reorgRollbackTable } from "../src/storage";
import { getPgliteDb, testTable } from "./helper";

describe("Drizzle storage", () => {
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
});
