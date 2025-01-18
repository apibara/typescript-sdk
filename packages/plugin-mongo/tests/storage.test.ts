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
import { describe, expect, it } from "vitest";

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
    const indexerName = "persist-test";

    const indexer = getMockIndexer({
      override: {
        plugins: [
          mongoStorage({
            client,
            dbName,
            collections: ["test"],
            persistState: true,
            indexerName,
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
        indexerName,
      });
      expect(persistence).toMatchInlineSnapshot(`
        {
          "cursor": {
            "orderKey": 5000005n,
            "uniqueKey": null,
          },
          "filter": undefined,
        }
      `);
    });
  });

  it("should persist the filters and latest block number (factory mode)", async () => {
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
      plugins: [
        mongoStorage({
          client,
          dbName,
          collections: ["test"],
          persistState: true,
          indexerName,
        }),
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
          "id": "persist-test",
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
          "id": "persist-test",
          "toBlock": 106,
        },
        {
          "filter": {
            "filter": "BC",
          },
          "fromBlock": 106,
          "id": "persist-test",
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
      plugins: [
        mongoStorage({
          client,
          dbName,
          collections: ["test"],
          persistState: true,
          indexerName,
        }),
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
          "id": "persist-test",
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
          "id": "persist-test",
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
      plugins: [
        mongoStorage({
          client,
          dbName,
          collections: ["test"],
          persistState: true,
          indexerName,
        }),
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
          "id": "persist-test",
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
          "id": "persist-test",
          "toBlock": null,
        },
      ]
    `);
  });
});

function getRandomDatabase() {
  const dbName = crypto.randomUUID().replace(/-/g, "_");
  const client = new MongoClient("mongodb://localhost:27017/?replicaSet=rs0");
  const db = client.db(dbName);
  return { db, client, dbName };
}
