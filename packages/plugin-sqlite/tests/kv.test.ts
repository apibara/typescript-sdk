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

import { sqliteStorage, useSqliteKeyValueStore } from "../src";

describe("SQLite key-value store", () => {
  it("should be able to store and retrieve values", async () => {
    const db = new Database(":memory:");

    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(3);
    });

    const indexer = getMockIndexer({
      override: {
        plugins: [sqliteStorage({ database: db })],
        async transform({ block: { data }, endCursor }) {
          const blockNumber = Number(endCursor?.orderKey ?? 0);

          const kv = useSqliteKeyValueStore();

          kv.put(`data-${blockNumber}`, data);
          kv.del(`data-${blockNumber - 1}`);

          const prev = kv.get("latest");
          if (prev !== undefined) {
            expect(prev).toBe(blockNumber - 1);
          }

          kv.put("latest", blockNumber);
        },
      },
    });

    await run(client, indexer);

    const rows = db.prepare("SELECT * FROM kvs").all();
    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "from_block": 5000000,
          "k": "data-5000000",
          "to_block": 5000001,
          "v": ""5000000"",
        },
        {
          "from_block": 5000000,
          "k": "latest",
          "to_block": 5000001,
          "v": "5000000",
        },
        {
          "from_block": 5000001,
          "k": "data-5000001",
          "to_block": 5000002,
          "v": ""5000001"",
        },
        {
          "from_block": 5000001,
          "k": "latest",
          "to_block": 5000002,
          "v": "5000001",
        },
        {
          "from_block": 5000002,
          "k": "data-5000002",
          "to_block": null,
          "v": ""5000002"",
        },
        {
          "from_block": 5000002,
          "k": "latest",
          "to_block": null,
          "v": "5000002",
        },
      ]
    `);
  });

  it("should throw if the key-value store is not enabled", async () => {
    const db = new Database(":memory:");

    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages(3);
    });

    const indexer = getMockIndexer({
      override: {
        plugins: [sqliteStorage({ database: db, keyValueStore: false })],
        async transform(_args) {
          const _kv = useSqliteKeyValueStore();
        },
      },
    });

    await expect(run(client, indexer)).rejects.toThrow();
  });
});
