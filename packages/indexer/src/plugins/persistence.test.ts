import type { Cursor } from "@apibara/protocol";
import {
  type MockBlock,
  MockClient,
  type MockFilter,
} from "@apibara/protocol/testing";
import { klona } from "klona/full";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { describe, expect, it } from "vitest";
import { run } from "../indexer";
import { generateMockMessages } from "../testing";
import { type MockRet, getMockIndexer } from "../testing/indexer";
import { SqlitePersistence, sqlitePersistence } from "./persistence";

describe("Persistence", () => {
  const initDB = async () => {
    const db = await open({ driver: sqlite3.Database, filename: ":memory:" });
    await SqlitePersistence.initialize(db);
    return db;
  };

  it("should handle storing and updating a cursor", async () => {
    const db = await initDB();
    const store = new SqlitePersistence(db);

    // Assert there's no data
    let latest = await store.get();
    expect(latest).toBeUndefined();

    // Insert value
    const cursor: Cursor = {
      orderKey: 5_000_000n,
    };
    await store.put(cursor);

    // Check that value was stored
    latest = await store.get();
    expect(latest).toEqual({
      orderKey: 5_000_000n,
      uniqueKey: null,
    });

    // Update value
    const updatedCursor: Cursor = {
      orderKey: 5_000_010n,
      uniqueKey: "0x1234567890",
    };
    await store.put(updatedCursor);

    // Check that value was updated
    latest = await store.get();
    expect(latest).toEqual({
      orderKey: 5_000_010n,
      uniqueKey: "0x1234567890",
    });

    await db.close();
  });

  it("should handle storing and deleting a cursor", async () => {
    const db = await initDB();
    const store = new SqlitePersistence(db);

    // Assert there's no data
    let latest = await store.get();
    expect(latest).toBeUndefined();

    // Insert value
    const cursor: Cursor = {
      orderKey: 5_000_000n,
    };
    await store.put(cursor);

    // Check that value was stored
    latest = await store.get();
    expect(latest).toEqual({
      orderKey: 5_000_000n,
      uniqueKey: null,
    });

    // Delete value
    await store.del();

    // Check there's no data
    latest = await store.get();
    expect(latest).toBeUndefined();

    await db.close();
  });

  it("should work with indexer and store cursor of last message", async () => {
    const client = new MockClient(messages, [{}]);

    const persistence = sqlitePersistence<MockFilter, MockBlock, MockRet>({
      driver: sqlite3.Database,
      filename: "file:memdb1?mode=memory&cache=shared",
    });

    // create mock indexer with persistence plugin
    const indexer = klona(getMockIndexer([persistence]));

    await run(client, indexer);

    // open same db again to check last cursor
    const db = await open({
      driver: sqlite3.Database,
      filename: "file:memdb1?mode=memory&cache=shared",
    });

    const store = new SqlitePersistence(db);

    const latest = await store.get();

    expect(latest).toMatchInlineSnapshot(`
      {
        "orderKey": 5000009n,
        "uniqueKey": null,
      }
    `);
  });
});

const messages = generateMockMessages();
