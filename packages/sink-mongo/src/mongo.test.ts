import { run, useSink } from "@apibara/indexer";
import {
  generateMockMessages,
  getMockIndexer,
} from "@apibara/indexer/internal";
import type { Cursor } from "@apibara/protocol";
import {
  type MockBlock,
  MockClient,
  type MockFilter,
} from "@apibara/protocol/testing";
import { MongoClient, type WithId } from "mongodb";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { mongoSink } from "./mongo";

const TEST_COLLECTION = "test_collection";
const mongoClient = new MongoClient(
  "mongodb://localhost:27017/?replicaSet=rs0",
);

interface Schema {
  blockNumber: number;
  data: string | undefined;
  _cursor?: {
    from: number;
    to: number | null;
  };
}

const db = mongoClient.db("test");

describe("MongoDB Sink Test", () => {
  beforeAll(async () => {
    await mongoClient.connect();
  });

  beforeEach(async () => {
    await db.collection(TEST_COLLECTION).deleteMany({});
  });

  it("should insert data", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(5);
    });

    const sink = mongoSink({
      client: mongoClient,
      dbName: "test",
      collections: [TEST_COLLECTION],
    });

    const indexer = getMockIndexer({
      sink,
      override: {
        transform: async ({ context, endCursor, block: { data } }) => {
          const { db } = useSink({ context });
          await db.collection<Schema>(TEST_COLLECTION).insertOne({
            blockNumber: Number(endCursor?.orderKey),
            data,
          });
        },
      },
    });

    await run(client, indexer);

    const result = await db
      .collection<Schema>(TEST_COLLECTION)
      .find({}, { sort: { blockNumber: 1 } })
      .toArray();

    expect(result).toHaveLength(5);
    expect(result[0].data).toBe("5000000");
    expect(result[2].data).toBe("5000002");
  });

  it("should update data", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(5);
    });

    const sink = mongoSink({
      client: mongoClient,
      dbName: "test",
      collections: [TEST_COLLECTION],
    });

    const indexer = getMockIndexer({
      sink,
      override: {
        transform: async ({ context, endCursor, block: { data } }) => {
          const { db } = useSink({ context });

          // insert data for each message in db
          await db.collection<Schema>(TEST_COLLECTION).insertOne({
            blockNumber: Number(endCursor?.orderKey),
            data,
          });

          // update data for id 5000002 when orderKey is 5000004
          // this is to test if the update query is working
          if (endCursor?.orderKey === 5000004n) {
            // Find the document and update it, creating a new version
            await db
              .collection<Schema>(TEST_COLLECTION)
              .updateOne(
                { blockNumber: 5000002 },
                { $set: { data: "0000000" } },
              );
          }
        },
      },
    });

    await run(client, indexer);

    const result = await db
      .collection<Schema>(TEST_COLLECTION)
      .find()
      .sort({ blockNumber: 1 })
      .toArray();

    expect(result).toHaveLength(6);
    expect(
      result.find((r) => r.blockNumber === 5000002 && r._cursor?.to === null)
        ?.data,
    ).toBe("0000000");
  });

  it("should handle soft deletes", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(5);
    });

    const sink = mongoSink({
      client: mongoClient,
      dbName: "test",
      collections: [TEST_COLLECTION],
    });

    const indexer = getMockIndexer({
      sink,
      override: {
        transform: async ({ context, endCursor, block: { data } }) => {
          const { db } = useSink({ context });

          // insert data for each message in db
          await db.collection<Schema>(TEST_COLLECTION).insertOne({
            blockNumber: Number(endCursor?.orderKey),
            data,
          });

          // delete data for id 5000002 when orderKey is 5000004
          // this is to test if the delete query is working
          if (endCursor?.orderKey === 5000004n) {
            await db
              .collection<Schema>(TEST_COLLECTION)
              .deleteOne({ blockNumber: 5000002 });
          }
        },
      },
    });

    await run(client, indexer);

    const result = await db
      .collection<Schema>(TEST_COLLECTION)
      .find()
      .sort({ blockNumber: 1 })
      .toArray();

    expect(result).toHaveLength(5);

    // as when you run delete query on a data, it isnt literally deleted from the db,
    // instead, we just update the upper bound of that row to the current cursor
    // check if the cursor upper bound has been set correctly
    expect(result.find((r) => r.blockNumber === 5000002)?._cursor?.to).toBe(
      5000004,
    );
  });

  it("should select data", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(5);
    });

    const sink = mongoSink({
      client: mongoClient,
      dbName: "test",
      collections: [TEST_COLLECTION],
    });

    let result: WithId<Schema>[] = [];

    const indexer = getMockIndexer({
      sink,
      override: {
        transform: async ({ context, endCursor, block: { data } }) => {
          const { db } = useSink({ context });

          // insert data for each message in db
          await db.collection<Schema>(TEST_COLLECTION).insertOne({
            blockNumber: Number(endCursor?.orderKey),
            data,
          });

          // delete data for id 5000002 when orderKey is 5000004
          // this will update the upper bound of the row with id 5000002 from null to 5000004
          // so when we select all rows, row with id 5000002 will not be included
          // as when we run select query it should only return rows with upper bound null
          if (endCursor?.orderKey === 5000003n) {
            await db
              .collection<Schema>(TEST_COLLECTION)
              .deleteOne({ blockNumber: 5000002 });
          }

          // when on last message of mock stream, select all rows from db
          if (endCursor?.orderKey === 5000004n) {
            result = await db
              .collection<Schema>(TEST_COLLECTION)
              .find({})
              .sort({ blockNumber: 1 })
              .toArray();
          }
        },
      },
    });

    await run(client, indexer);

    expect(result).toHaveLength(4);
    expect(result.find((r) => r.blockNumber === 5000002)).toBeUndefined();
    // check if all rows are still in db
    const allRows = await db
      .collection<Schema>(TEST_COLLECTION)
      .find()
      .toArray();
    expect(allRows).toHaveLength(5);
  });

  it("should invalidate data correctly", async () => {
    const sink = mongoSink({
      client: mongoClient,
      dbName: "test",
      collections: [TEST_COLLECTION],
    });

    // Insert test data
    await db.collection<Schema>(TEST_COLLECTION).insertMany([
      { blockNumber: 1, data: "data1", _cursor: { from: 1, to: 5 } },
      { blockNumber: 2, data: "data2", _cursor: { from: 2, to: 5 } },
      { blockNumber: 3, data: "data3", _cursor: { from: 3, to: null } },
      { blockNumber: 4, data: "data4", _cursor: { from: 4, to: null } },
      { blockNumber: 5, data: "data5", _cursor: { from: 5, to: null } },
    ]);

    // Create a cursor at position 3
    const cursor: Cursor = { orderKey: 3n };

    // Invalidate data
    await sink.invalidate(cursor);

    // Check the results
    const result = await db
      .collection<Schema>(TEST_COLLECTION)
      .find()
      .sort({ blockNumber: 1 })
      .toArray();

    expect(result).toHaveLength(3);
    expect(result[0]._cursor?.to).toBe(null);
    expect(result[1]._cursor?.to).toBe(null);
    expect(result[2]._cursor?.to).toBe(null);
  });

  afterAll(async () => {
    await mongoClient.close();
  });
});
