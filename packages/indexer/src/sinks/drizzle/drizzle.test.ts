import {
  type MockBlock,
  MockClient,
  type MockFilter,
} from "@apibara/protocol/testing";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { serial, text } from "drizzle-orm/pg-core";
import { Client } from "pg";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type Int8Range, drizzle as drizzleSink, pgTable } from ".";
import { useSink } from "../../hooks";
import { run } from "../../indexer";
import { generateMockMessages } from "../../testing";
import { getMockIndexer } from "../../testing/indexer";

const test_table = pgTable("test_table", {
  id: serial("id").primaryKey(),
  data: text("data"),
});

const client = new Client({
  connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
});

await client.connect();

const db = drizzle(client);

describe("Drizzle Test", () => {
  beforeAll(async () => {
    // drop test_table if exists
    await db.execute(sql`DROP TABLE IF EXISTS test_table`);
    // create test_table with db
    await db.execute(
      sql`CREATE TABLE test_table (id SERIAL PRIMARY KEY, data TEXT, _cursor INT8RANGE)`,
    );
  });

  beforeEach(async () => {
    await db.delete(test_table).execute();
  });

  it("should insert data", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(5);
    });

    const sink = drizzleSink({ database: db });

    const indexer = getMockIndexer({
      sink,
      override: {
        transform: async ({ context, endCursor, block: { data } }) => {
          const { transaction } = useSink({ context });

          const db = transaction(endCursor);

          // Insert a new row into the test_table
          // The id is set to the current cursor's orderKey
          // The data is set to the block data
          await db
            .insert(test_table)
            .values([{ id: Number(endCursor?.orderKey), data }]);
        },
      },
    });

    await run(client, indexer);

    const result = await db.select().from(test_table);

    expect(result).toHaveLength(5);
    expect(result[0].data).toBe("5000000");
    expect(result[2].data).toBe("5000002");
  });

  it("should update data", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(5);
    });

    const sink = drizzleSink({ database: db });

    const indexer = getMockIndexer({
      sink,
      override: {
        transform: async ({ context, endCursor, block: { data } }) => {
          const { transaction } = useSink({ context });

          const db = transaction(endCursor);

          // insert data for each message in db
          await db
            .insert(test_table)
            .values([{ id: Number(endCursor?.orderKey), data }]);

          // update data for id 5000002 when orderKey is 5000004
          // this is to test if the update query is working
          if (endCursor?.orderKey === 5000004n) {
            await db
              .update(test_table)
              .set({ data: "0000000" })
              .where(eq(test_table.id, 5000002));
          }
        },
      },
    });

    await run(client, indexer);

    const result = await db.select().from(test_table);

    expect(result).toHaveLength(5);
    expect(result.find((r) => r.id === 5000002)?.data).toBe("0000000");
  });

  it("should delete data", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(5);
    });

    const sink = drizzleSink({ database: db });

    const indexer = getMockIndexer({
      sink,
      override: {
        transform: async ({ context, endCursor, block: { data } }) => {
          const { transaction } = useSink({ context });

          const db = transaction(endCursor);

          // insert data for each message in db
          await db
            .insert(test_table)
            .values([{ id: Number(endCursor?.orderKey), data }]);

          // delete data for id 5000002 when orderKey is 5000004
          // this is to test if the delete query is working
          if (endCursor?.orderKey === 5000004n) {
            await db.delete(test_table).where(eq(test_table.id, 5000002));
          }
        },
      },
    });

    await run(client, indexer);

    const result = await db.select().from(test_table);

    expect(result).toHaveLength(5);

    // as when you run delete query on a data, it isnt literally deleted from the db,
    // instead, we just update the upper bound of that row to the current cursor
    // check if the cursor upper bound has been set correctly
    expect(
      (
        (result.find((r) => r.id === 5000002) as Record<string, unknown>)
          ._cursor as Int8Range
      ).range.upper,
    ).toBe(5000004);
  });

  it("should select data", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(5);
    });

    const sink = drizzleSink({ database: db });

    let result: (typeof test_table.$inferSelect)[] = [];

    const indexer = getMockIndexer({
      sink,
      override: {
        transform: async ({ context, endCursor, block: { data } }) => {
          const { transaction } = useSink({ context });

          const db = transaction(endCursor);

          // insert data for each message in db
          await db
            .insert(test_table)
            .values([{ id: Number(endCursor?.orderKey), data }]);

          // delete data for id 5000002 when orderKey is 5000004
          // this will update the upper bound of the row with id 5000002 from infinity to 5000004
          // so when we select all rows, row with id 5000002 will not be included
          // as when we run select query it should only return rows with upper bound infinity
          if (endCursor?.orderKey === 5000003n) {
            await db.delete(test_table).where(eq(test_table.id, 5000002));
          }

          // when on last message of mock stream, select all rows from db
          if (endCursor?.orderKey === 5000004n) {
            result = await db.select().from(test_table);
          }
        },
      },
    });

    await run(client, indexer);

    expect(result).toHaveLength(4);
    expect(result.find((r) => r.id === 5000002)).toBeUndefined();
  });
});
