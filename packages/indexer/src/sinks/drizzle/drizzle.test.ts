import type { Cursor } from "@apibara/protocol";
import {
  type MockBlock,
  MockClient,
  type MockFilter,
} from "@apibara/protocol/testing";
import { asc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { serial, text } from "drizzle-orm/pg-core";
import { Client } from "pg";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { run } from "../../indexer";
import { generateMockMessages, getMockIndexer } from "../../internal/testing";
import { useSink } from "../../sink";
import type { Int8Range } from "./Int8Range";
import { drizzleSink } from "./drizzle";
import { getDrizzleCursor, pgIndexerTable } from "./utils";

const testTable = pgIndexerTable("test_table", {
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
      sql`CREATE TABLE test_table (id SERIAL, data TEXT, _cursor INT8RANGE)`,
    );
  });

  beforeEach(async () => {
    await db.delete(testTable).execute();
  });

  it("should insert data", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(5);
    });

    const sink = drizzleSink({ database: db, tables: [testTable] });

    const indexer = getMockIndexer({
      sink,
      override: {
        transform: async ({ context, endCursor, block: { data } }) => {
          const { db } = useSink({ context });
          // Insert a new row into the test_table
          // The id is set to the current cursor's orderKey
          // The data is set to the block data
          await db
            .insert(testTable)
            .values([{ id: Number(endCursor?.orderKey), data }]);
        },
      },
    });

    await run(client, indexer);

    const result = await db.select().from(testTable).orderBy(asc(testTable.id));

    expect(result).toHaveLength(5);
    expect(result[0].data).toBe("5000000");
    expect(result[2].data).toBe("5000002");
  });

  it("should update data", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(5);
    });

    const sink = drizzleSink({ database: db, tables: [testTable] });

    const indexer = getMockIndexer({
      sink,
      override: {
        transform: async ({ context, endCursor, block: { data } }) => {
          const { db } = useSink({ context });

          // insert data for each message in db
          await db
            .insert(testTable)
            .values([{ id: Number(endCursor?.orderKey), data }]);

          // update data for id 5000002 when orderKey is 5000004
          // this is to test if the update query is working
          if (endCursor?.orderKey === 5000004n) {
            await db
              .update(testTable)
              .set({ data: "0000000" })
              .where(eq(testTable.id, 5000002));
          }
        },
      },
    });

    await run(client, indexer);

    const result = await db.select().from(testTable).orderBy(asc(testTable.id));

    expect(result).toHaveLength(6);
    expect(
      result.find((r) => r.id === 5000002 && r._cursor?.range.upper === null)
        ?.data,
    ).toBe("0000000");
  });

  it("should soft delete data", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(5);
    });

    const sink = drizzleSink({ database: db, tables: [testTable] });

    const indexer = getMockIndexer({
      sink,
      override: {
        transform: async ({ context, endCursor, block: { data } }) => {
          const { db } = useSink({ context });

          // insert data for each message in db
          await db
            .insert(testTable)
            .values([{ id: Number(endCursor?.orderKey), data }]);

          // delete data for id 5000002 when orderKey is 5000004
          // this is to test if the delete query is working
          if (endCursor?.orderKey === 5000004n) {
            await db.delete(testTable).where(eq(testTable.id, 5000002));
          }
        },
      },
    });

    await run(client, indexer);

    const result = await db.select().from(testTable).orderBy(asc(testTable.id));

    expect(result).toHaveLength(5);

    // as when you run delete query on a data, it isnt literally deleted from the db,
    // instead, we just update the upper bound of that row to the current cursor
    // check if the cursor upper bound has been set correctly
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    expect(((result[2] as any)._cursor as Int8Range).range.upper).toBe(5000004);
  });

  it("should select data", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(5);
    });

    const sink = drizzleSink({ database: db, tables: [testTable] });

    let result: (typeof testTable.$inferSelect)[] = [];

    const indexer = getMockIndexer({
      sink,
      override: {
        transform: async ({ context, endCursor, block: { data } }) => {
          const { db } = useSink({ context });

          // insert data for each message in db
          await db
            .insert(testTable)
            .values([{ id: Number(endCursor?.orderKey), data }]);

          // delete data for id 5000002 when orderKey is 5000004
          // this will update the upper bound of the row with id 5000002 from infinity to 5000004
          // so when we select all rows, row with id 5000002 will not be included
          // as when we run select query it should only return rows with upper bound infinity
          if (endCursor?.orderKey === 5000003n) {
            await db.delete(testTable).where(eq(testTable.id, 5000002));
          }

          // when on last message of mock stream, select all rows from db
          if (endCursor?.orderKey === 5000004n) {
            result = await db
              .select()
              .from(testTable)
              .orderBy(asc(testTable.id));
          }
        },
      },
    });

    await run(client, indexer);

    expect(result).toHaveLength(4);
    expect(result.find((r) => r.id === 5000002)).toBeUndefined();
    // check if all rows are still in db
    const allRows = await db.select().from(testTable);
    expect(allRows).toHaveLength(5);
  });

  it("should invalidate data correctly", async () => {
    const sink = drizzleSink({ database: db, tables: [testTable] });

    // Insert some test data
    await db.insert(testTable).values(
      // @ts-ignore
      [
        { id: 1, data: "data1", _cursor: getDrizzleCursor([1n, 5n]) },
        { id: 2, data: "data2", _cursor: getDrizzleCursor([2n, 5n]) },
        { id: 3, data: "data3", _cursor: getDrizzleCursor(3n) },
        { id: 4, data: "data4", _cursor: getDrizzleCursor(4n) },
        { id: 5, data: "data5", _cursor: getDrizzleCursor(5n) },
      ],
    );

    // Create a cursor at position 3
    const cursor: Cursor = { orderKey: 3n };

    // Invalidate data
    await sink.invalidate(cursor);

    // Check the results
    const result = await db.select().from(testTable).orderBy(asc(testTable.id));

    expect(result).toHaveLength(3);
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    expect(((result[0] as any)._cursor as Int8Range).range.upper).toBe(null);
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    expect(((result[1] as any)._cursor as Int8Range).range.upper).toBe(null);
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    expect(((result[2] as any)._cursor as Int8Range).range.upper).toBe(null);
  });
});
