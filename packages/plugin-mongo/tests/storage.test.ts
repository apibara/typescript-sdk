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

describe("SQLite persistence", () => {
  it("should store data with a cursor", async () => {
    const { db, client, dbName } = getRandomDatabase();

    const indexer = getMockIndexer({
      override: {
        plugins: [mongoStorage({ client, dbName, collections: ["test"] })],
        async transform({ endCursor, block: { data } }) {
          const db = useMongoStorage();
          const rows = await db.collection("test").find({}).toArray();

          await db.collection("test").insertOne({
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
          const rows = await db.collection("test").find({}).toArray();
          const result = await db.collection("test").updateOne(
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
            await db.collection("test").insertOne({
              key: "abc",
              blockNumber: Number(endCursor?.orderKey),
              count: rows.length,
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
            "from": 5000002,
            "to": null,
          },
          "blockNumber": 5000002,
          "count": 1,
          "key": "abc",
        },
        {
          "_cursor": {
            "from": 5000000,
            "to": 5000001,
          },
          "blockNumber": 5000000,
          "count": 0,
          "key": "abc",
        },
        {
          "_cursor": {
            "from": 5000001,
            "to": 5000002,
          },
          "blockNumber": 5000001,
          "count": 1,
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

          const value = await db.collection("test").findOne({
            key: "abc",
          });

          if (value) {
            await db.collection("test").deleteOne({
              key: "abc",
            });
          } else {
            await db.collection("test").insertOne({
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
});

function getRandomDatabase() {
  const dbName = crypto.randomUUID().replace(/-/g, "_");
  const client = new MongoClient("mongodb://localhost:27017/?replicaSet=rs0");
  const db = client.db(dbName);
  return { db, client, dbName };
}
