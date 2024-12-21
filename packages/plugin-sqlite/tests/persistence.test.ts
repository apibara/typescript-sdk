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
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

import { sqliteStorage } from "../src";

describe("SQLite persistence", () => {
  it("should store the latest block number", async () => {
    const db = new Database(":memory:");

    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(3);
    });

    const indexer = getMockIndexer({
      override: {
        plugins: [sqliteStorage({ database: db })],
      },
    });

    await run(client, indexer);

    const rows = db.prepare("SELECT * FROM checkpoints").all();

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "id": "default",
          "order_key": 5000002,
          "unique_key": null,
        },
      ]
    `);
  });

  it("should not store the block if the handler throws", async () => {
    const db = new Database(":memory:");

    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(3);
    });

    const indexer = getMockIndexer({
      override: {
        plugins: [sqliteStorage({ database: db })],
        async transform({ endCursor }) {
          if (endCursor?.orderKey === 5000002n) {
            throw new Error("test");
          }
        },
      },
    });

    try {
      await run(client, indexer);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    const rows = db.prepare("SELECT * FROM checkpoints").all();

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "id": "default",
          "order_key": 5000001,
          "unique_key": null,
        },
      ]
    `);
  });

  it("should not store the state if it's disabled", async () => {
    const db = new Database(":memory:");

    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(3);
    });

    const indexer = getMockIndexer({
      override: {
        plugins: [sqliteStorage({ database: db, persistState: false })],
      },
    });

    await run(client, indexer);

    expect(() => db.prepare("SELECT * FROM checkpoints").all()).toThrow();
  });
});
