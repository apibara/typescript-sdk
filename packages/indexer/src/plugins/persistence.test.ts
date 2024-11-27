import type { Cursor } from "@apibara/protocol";
import {
  type MockBlock,
  MockClient,
  type MockFilter,
} from "@apibara/protocol/testing";
import Database from "better-sqlite3";
import { klona } from "klona/full";
import { describe, expect, it } from "vitest";
import { run } from "../indexer";
import { generateMockMessages, getMockIndexer } from "../internal/testing";
import { SqlitePersistence, sqlitePersistence } from "./persistence";

describe("Persistence", () => {
  const initDB = () => {
    const db = new Database(":memory:");
    SqlitePersistence.initialize(db);
    return db;
  };

  it("should handle storing and updating a cursor & filter", () => {
    const db = initDB();
    const store = new SqlitePersistence<MockFilter>(db);

    // Assert there's no data
    let latest = store.get();

    expect(latest.cursor).toBeUndefined();
    expect(latest.filter).toBeUndefined();

    // Insert value
    const cursor: Cursor = {
      orderKey: 5_000_000n,
    };
    const filter: MockFilter = {
      filter: "X",
    };
    store.put({ cursor, filter });

    // Check that value was stored
    latest = store.get();

    expect(latest.cursor).toEqual({
      orderKey: 5_000_000n,
      uniqueKey: null,
    });
    expect(latest.filter).toEqual({
      filter: "X",
    });

    // Update value
    const updatedCursor: Cursor = {
      orderKey: 5_000_010n,
      uniqueKey: "0x1234567890",
    };
    const updatedFilter: MockFilter = {
      filter: "Y",
    };

    store.put({ cursor: updatedCursor, filter: updatedFilter });

    // Check that value was updated
    latest = store.get();

    expect(latest.cursor).toEqual({
      orderKey: 5_000_010n,
      uniqueKey: "0x1234567890",
    });
    expect(latest.filter).toEqual({
      filter: "Y",
    });

    db.close();
  });

  it("should handle storing and deleting a cursor & filter", () => {
    const db = initDB();
    const store = new SqlitePersistence(db);

    // Assert there's no data
    let latest = store.get();
    expect(latest.cursor).toBeUndefined();
    expect(latest.filter).toBeUndefined();

    // Insert value
    const cursor: Cursor = {
      orderKey: 5_000_000n,
    };
    const filter: MockFilter = {
      filter: "X",
    };
    store.put({ cursor, filter });

    // Check that value was stored
    latest = store.get();
    expect(latest.cursor).toEqual({
      orderKey: 5_000_000n,
      uniqueKey: null,
    });
    expect(latest.filter).toEqual({
      filter: "X",
    });

    // Delete value
    store.del();

    // Check there's no data
    latest = store.get();
    expect(latest.cursor).toBeUndefined();
    expect(latest.filter).toBeUndefined();

    db.close();
  });

  it("should work with indexer and store cursor of last message", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return messages;
    });

    const db = new Database(":memory:");

    // create mock indexer with persistence plugin
    const indexer = klona(
      getMockIndexer({
        plugins: [
          sqlitePersistence({
            database: db,
          }),
        ],
      }),
    );

    await run(client, indexer);

    const store = new SqlitePersistence<MockFilter>(db);

    const latest = store.get();

    expect(latest.cursor).toMatchInlineSnapshot(`
      {
        "orderKey": 5000009n,
        "uniqueKey": null,
      }
    `);

    db.close();
  });
});

const messages = generateMockMessages();
