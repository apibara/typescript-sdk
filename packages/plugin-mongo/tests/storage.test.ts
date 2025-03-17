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
import { describe, expect, it } from "vitest";

import { generateIndexerId } from "@apibara/indexer/internal";
import type { Finalize, Invalidate } from "@apibara/protocol";
import { MongoClient } from "mongodb";
import { mongoStorage, useMongoStorage } from "../src";
import {
  checkpointCollectionName,
  filterCollectionName,
  getState,
} from "../src/persistence";
import { withTransaction } from "../src/utils";

type TestSchema = {
  blockNumber: number;
  key?: string;
  count?: number;
  data?: string;
  _cursor?: {
    from: number;
    to: number | null;
  };
};

const indexerId = generateIndexerId("testing");

describe("MongoDB Test", () => {
  it("should store data with a cursor", async () => {
    const { db, client, dbName } = getRandomDatabase();

    const indexer = getMockIndexer({
      override: {
        plugins: [mongoStorage({ client, dbName, collections: ["test"] })],
        async transform({ endCursor, block: { data } }) {
          const db = useMongoStorage();
          const collection = db.collection<TestSchema>("test");

          const rows = await collection.find({}).toArray();

          await collection.insertOne({
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

    const result = await db.collection("test").find().toArray();
    expect(result.map(({ _id, ...rest }) => rest)).toMatchInlineSnapshot(`
      [
        {
          "_cursor": {
            "from": 5000000,
            "to": null,
          },
          "blockNumber": 5000000,
          "count": 0,
          "data": "5000000",
        },
        {
          "_cursor": {
            "from": 5000001,
            "to": null,
          },
          "blockNumber": 5000001,
          "count": 1,
          "data": "5000001",
        },
        {
          "_cursor": {
            "from": 5000002,
            "to": null,
          },
          "blockNumber": 5000002,
          "count": 2,
          "data": "5000002",
        },
      ]
    `);
  });

  it("should update data", async () => {
    const { db, client, dbName } = getRandomDatabase();

    const indexer = getMockIndexer({
      override: {
        plugins: [mongoStorage({ client, dbName, collections: ["test"] })],
        async transform({ endCursor, block: { data } }) {
          const db = useMongoStorage();
          const collection = db.collection<TestSchema>("test");
          const rows = await collection.find({}).toArray();

          const result = await collection.updateOne(
            {
              key: "abc",
            },
            {
              $set: {
                blockNumber: Number(endCursor?.orderKey),
                count: rows.length,
              },
            },
          );

          if (result.modifiedCount === 0) {
            await collection.insertOne({
              key: "abc",
              blockNumber: Number(endCursor?.orderKey),
              count: rows.length,
              data,
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

    const result = await db
      .collection("test")
      .find()
      .sort({ blockNumber: 1 })
      .toArray();

    expect(result.map(({ _id, ...rest }) => rest)).toMatchInlineSnapshot(`
      [
        {
          "_cursor": {
            "from": 5000000,
            "to": 5000001,
          },
          "blockNumber": 5000000,
          "count": 0,
          "data": "5000000",
          "key": "abc",
        },
        {
          "_cursor": {
            "from": 5000001,
            "to": 5000002,
          },
          "blockNumber": 5000001,
          "count": 1,
          "data": "5000000",
          "key": "abc",
        },
        {
          "_cursor": {
            "from": 5000002,
            "to": null,
          },
          "blockNumber": 5000002,
          "count": 1,
          "data": "5000000",
          "key": "abc",
        },
      ]
    `);
  });

  it("should delete data", async () => {
    const { db, client, dbName } = getRandomDatabase();

    const indexer = getMockIndexer({
      override: {
        plugins: [mongoStorage({ client, dbName, collections: ["test"] })],
        async transform({ endCursor }) {
          const db = useMongoStorage();
          const collection = db.collection<TestSchema>("test");

          const value = await collection.findOne({
            key: "abc",
          });

          if (value) {
            await collection.deleteOne({
              key: "abc",
            });
          } else {
            await collection.insertOne({
              key: "abc",
              blockNumber: Number(endCursor?.orderKey),
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

    const result = await db.collection("test").find().toArray();
    expect(result.map(({ _id, ...rest }) => rest)).toMatchInlineSnapshot(`
      [
        {
          "_cursor": {
            "from": 5000000,
            "to": 5000001,
          },
          "blockNumber": 5000000,
          "key": "abc",
        },
        {
          "_cursor": {
            "from": 5000002,
            "to": null,
          },
          "blockNumber": 5000002,
          "key": "abc",
        },
      ]
    `);
  });

  it("should select data", async () => {
    const { db, client, dbName } = getRandomDatabase();

    const indexer = getMockIndexer({
      override: {
        plugins: [mongoStorage({ client, dbName, collections: ["test"] })],
        async transform({ endCursor }) {
          const db = useMongoStorage();

          const collection = db.collection<TestSchema>("test");

          // Insert data with each message
          await collection.insertOne({
            key: "abc",
            blockNumber: Number(endCursor?.orderKey),
            data: `data${endCursor?.orderKey}`,
          });

          // Delete data at block 5000001
          if (endCursor?.orderKey === 5000001n) {
            await collection.deleteOne({
              blockNumber: 5000000,
            });
          }

          // we check at last block if the data is deleted
          if (endCursor?.orderKey === 5000002n) {
            const latestData = await collection.find({}).toArray();
            expect(latestData.length).toBe(2);
            expect(latestData.some((d) => d.blockNumber === 5000000)).toBe(
              false,
            );
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
  });

  it("should invalidate data", async () => {
    const { db, client, dbName } = getRandomDatabase();

    const indexer = getMockIndexer({
      override: {
        plugins: [mongoStorage({ client, dbName, collections: ["test"] })],
        async transform({ endCursor, block: { data } }) {
          const db = useMongoStorage();
          const collection = db.collection<TestSchema>("test");
          const rows = await collection.find({}).toArray();

          const result = await collection.updateOne(
            {
              key: "abc",
            },
            {
              $set: {
                blockNumber: Number(endCursor?.orderKey),
                count: rows.length,
              },
            },
          );

          if (result.modifiedCount === 0) {
            await collection.insertOne({
              key: "abc",
              blockNumber: Number(endCursor?.orderKey),
              count: rows.length,
              data,
            });
          }
        },
      },
    });

    const mockClient = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
        return generateMockMessages(3, {
          // we invalidate at 3rd (last and index 2) message
          // and we invalidate cursor 5000001 (2nd message and index 1)
          invalidate: { invalidateTriggerIndex: 2, invalidateFromIndex: 1 },
        });
      },
    );

    await run(mockClient, indexer);

    const result = await db
      .collection("test")
      .find()
      .sort({ blockNumber: 1 })
      .toArray();

    expect(result.map(({ _id, ...rest }) => rest)).toMatchInlineSnapshot(`
      [
        {
          "_cursor": {
            "from": 5000000,
            "to": 5000001,
          },
          "blockNumber": 5000000,
          "count": 0,
          "data": "5000000",
          "key": "abc",
        },
        {
          "_cursor": {
            "from": 5000001,
            "to": null,
          },
          "blockNumber": 5000001,
          "count": 1,
          "data": "5000000",
          "key": "abc",
        },
      ]
    `);
  });

  it("should persist state", async () => {
    const { db, client, dbName } = getRandomDatabase();

    const indexer = getMockIndexer({
      override: {
        plugins: [
          mongoStorage({
            client,
            dbName,
            collections: ["test"],
            persistState: true,
          }),
        ],
        async transform({ endCursor }) {
          const db = useMongoStorage();

          const collection = db.collection<TestSchema>("test");

          // Insert data with each message
          await collection.insertOne({
            blockNumber: Number(endCursor?.orderKey),
            data: `data${endCursor?.orderKey}`,
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
      "Intentional error to test persistence",
    );

    // Verify thrown transform data is not committed in db
    const result = await db
      .collection<TestSchema>("test")
      .find()
      .sort({ blockNumber: 1 })
      .toArray();
    expect(result).toHaveLength(6); // Should have 6 documents (0-5)
    expect(result[result.length - 1].blockNumber).toBe(5000005);

    await withTransaction(client, async (session) => {
      const persistence = await getState({
        db,
        session,
        indexerId,
      });
      expect(persistence).toMatchInlineSnapshot(`
        {
          "cursor": {
            "orderKey": 5000005n,
          },
          "filter": undefined,
        }
      `);
    });
  });

  it("should persist the filters and latest block number (factory mode)", async () => {
    const { db, client, dbName } = getRandomDatabase();

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
        plugins: [
          mongoStorage({
            client,
            dbName,
            collections: ["test"],
            persistState: true,
          }),
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

    const checkpointsRows = await db
      .collection(checkpointCollectionName)
      .find()
      .toArray();
    const filtersRows = await db
      .collection(filterCollectionName)
      .find()
      .toArray();

    expect(
      checkpointsRows.map(({ _id, ...rest }) => rest),
    ).toMatchInlineSnapshot(`
      [
        {
          "id": "indexer_testing_default",
          "orderKey": 108,
          "uniqueKey": null,
        },
      ]
    `);
    expect(filtersRows.map(({ _id, ...rest }) => rest)).toMatchInlineSnapshot(`
      [
        {
          "filter": {
            "filter": "B",
          },
          "fromBlock": 103,
          "id": "indexer_testing_default",
          "toBlock": 106,
        },
        {
          "filter": {
            "filter": "BC",
          },
          "fromBlock": 106,
          "id": "indexer_testing_default",
          "toBlock": null,
        },
      ]
    `);
  });

  it("should invalidate state (factory mode)", async () => {
    const { db, client, dbName } = getRandomDatabase();
    const indexerName = "persist-test";

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
        plugins: [
          mongoStorage({
            client,
            dbName,
            collections: ["test"],
            persistState: true,
          }),
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

    const checkpointsRows = await db
      .collection(checkpointCollectionName)
      .find()
      .toArray();
    const filtersRows = await db
      .collection(filterCollectionName)
      .find()
      .toArray();

    expect(
      checkpointsRows.map(({ _id, ...rest }) => rest),
    ).toMatchInlineSnapshot(`
      [
        {
          "id": "indexer_testing_default",
          "orderKey": 107,
          "uniqueKey": null,
        },
      ]
    `);
    expect(filtersRows.map(({ _id, ...rest }) => rest)).toMatchInlineSnapshot(`
      [
        {
          "filter": {
            "filter": "B",
          },
          "fromBlock": 103,
          "id": "indexer_testing_default",
          "toBlock": null,
        },
      ]
    `);
  });

  it("should finalize state (factory mode)", async () => {
    const { db, client, dbName } = getRandomDatabase();
    const indexerName = "persist-test";

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
        plugins: [
          mongoStorage({
            client,
            dbName,
            collections: ["test"],
            persistState: true,
          }),
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

    const checkpointsRows = await db
      .collection(checkpointCollectionName)
      .find()
      .toArray();
    const filtersRows = await db
      .collection(filterCollectionName)
      .find()
      .toArray();

    expect(
      checkpointsRows.map(({ _id, ...rest }) => rest),
    ).toMatchInlineSnapshot(`
      [
        {
          "id": "indexer_testing_default",
          "orderKey": 107,
          "uniqueKey": null,
        },
      ]
    `);
    expect(filtersRows.map(({ _id, ...rest }) => rest)).toMatchInlineSnapshot(`
      [
        {
          "filter": {
            "filter": "BC",
          },
          "fromBlock": 106,
          "id": "indexer_testing_default",
          "toBlock": null,
        },
      ]
    `);
  });

  it("should handle pending data correctly", async () => {
    const { db, client, dbName } = getRandomDatabase();

    // This test simulates the below scenario:
    // 1. We have a pending block with transactions A, B, C
    // 2. The final accepted block only contains A, C, D, E (B is missing)
    // 3. We want to ensure that transaction B is not in the final table
    const indexer = getMockIndexer({
      override: {
        plugins: [mongoStorage({ client, dbName, collections: ["test"] })],
        async transform({ endCursor, block: { data }, finality }) {
          const db = useMongoStorage();
          const collection = db.collection<TestSchema>("test");

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
              await collection.insertOne({
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
    const result = await db.collection("test").find().toArray();

    // Sort by key for consistent test results
    const sortedResult = result.sort((a, b) =>
      (a.key || "").localeCompare(b.key || ""),
    );

    // We expect to see only transactions from the accepted block (A, C, D, E)
    // with the correct count (4) for each
    expect(
      sortedResult.map(({ _id, _cursor, ...r }) => r),
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
    const { db, client, dbName } = getRandomDatabase();

    // This test simulates a more complex scenario:
    // 1. First a pending block with transactions A, B
    // 2. The same pending block updated with transactions A, B, C
    // 3. The same pending block updated again with transactions A, C, D (B removed)
    // 4. Finally the block becomes accepted with transactions A, C, D, E
    // We want to ensure that only the final accepted transactions are in the table

    const indexer = getMockIndexer({
      override: {
        plugins: [mongoStorage({ client, dbName, collections: ["test"] })],
        async transform({ endCursor, block: { data }, finality }) {
          const db = useMongoStorage();
          const collection = db.collection<TestSchema>("test");

          if (data) {
            // Extract transaction IDs from the data string
            const parts = data.split("_");
            const blockType = parts[0]; // "PENDING" or "ACCEPTED"
            const txIds = parts.slice(1); // Transaction IDs

            // For each transaction in the block
            for (const txId of txIds) {
              // Insert new transaction
              await collection.insertOne({
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
    const result = await db.collection("test").find().toArray();

    // Sort by key for consistent test results
    const sortedResult = result.sort((a, b) =>
      (a.key || "").localeCompare(b.key || ""),
    );

    // We expect to see only transactions from the accepted block (A, C, D, E)
    // with the correct count (4) for each
    expect(
      sortedResult.map(({ _id, _cursor, ...r }) => r),
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
    const { db, client, dbName } = getRandomDatabase();
    // This test verifies that state is not persisted for pending blocks
    // and that the checkpoint only advances for accepted blocks

    const indexer = getMockIndexer({
      override: {
        plugins: [
          mongoStorage({
            client,
            dbName,
            collections: ["test"],
            persistState: true,
          }),
        ],
        async transform({ endCursor, block: { data }, finality }) {
          const db = useMongoStorage();
          const collection = db.collection<TestSchema>("test");

          // Insert a record for each block
          await collection.insertOne({
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
    const result = await db.collection("test").find().toArray();

    // data is invalidated before each transform if the prev block was pending
    expect(result.map(({ _id, ...r }) => r)).toMatchInlineSnapshot(`
      [
        {
          "_cursor": {
            "from": 5000001,
            "to": null,
          },
          "blockNumber": 5000001,
          "count": 1,
          "data": "accepted_block1",
          "key": "block_5000001",
        },
        {
          "_cursor": {
            "from": 5000002,
            "to": null,
          },
          "blockNumber": 5000002,
          "count": 1,
          "data": "accepted_block2",
          "key": "block_5000002",
        },
        {
          "_cursor": {
            "from": 5000003,
            "to": null,
          },
          "blockNumber": 5000003,
          "count": 1,
          "data": "pending_block3",
          "key": "block_5000003",
        },
      ]
    `);

    // Check the checkpoints collection
    const checkpointsResult = await db
      .collection(checkpointCollectionName)
      .find()
      .toArray();

    // should only have non-pending blocks in the checkpoint
    expect(checkpointsResult.map(({ _id, ...r }) => r)).toMatchInlineSnapshot(`
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

    // Verify that the pending blocks are stored correctly
    const pendingBlocks = result.filter((row) =>
      row.data?.startsWith("pending_"),
    );
    expect(pendingBlocks.length).toBe(1); // Only the last pending block should be present

    // Verify that all accepted blocks are present
    const acceptedBlocks = result.filter((row) =>
      row.data?.startsWith("accepted_"),
    );
    expect(acceptedBlocks.length).toBe(2); // Both accepted blocks should be present
  });
});

function getRandomDatabase() {
  const dbName = crypto.randomUUID().replace(/-/g, "_");
  const client = new MongoClient("mongodb://localhost:27017/?replicaSet=rs0");
  const db = client.db(dbName);
  return { db, client, dbName };
}
