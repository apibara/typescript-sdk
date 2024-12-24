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

import { MongoClient } from "mongodb";
import { mongoStorage, useMongoStorage } from "../src";
import { getState } from "../src/persistence";
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

describe("MongoDB persistence", () => {
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
});

function getRandomDatabase() {
  const dbName = crypto.randomUUID().replace(/-/g, "_");
  const client = new MongoClient("mongodb://localhost:27017/?replicaSet=rs0");
  const db = client.db(dbName);
  return { db, client, dbName };
}
