import fs from "node:fs/promises";
import {
  type MockBlock,
  MockClient,
  type MockFilter,
} from "@apibara/protocol/testing";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { run } from "../indexer";
import {} from "../plugins/persistence";
import { generateMockMessages } from "../testing";
import { type MockRet, getMockIndexer } from "../testing/indexer";
import { sqlite } from "./sqlite";

describe("Run Test", () => {
  async function cleanup() {
    try {
      await fs.unlink("file:memdb_sqlitesink?mode=memory&cache=shared");
      await fs.unlink("file:memdb_sqlitesink?mode=memory&cache=shared-wal");
      await fs.unlink("file:memdb_sqlitesink?mode=memory&cache=shared-shm");
    } catch {}
  }

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("should store in sqlite db via sqlitesink", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages();
    });

    const db = new Database("file:memdb_sqlitesink?mode=memory&cache=shared");

    db.prepare("DROP TABLE IF EXISTS test;").run();

    db.prepare(
      `
        CREATE TABLE IF NOT EXISTS test (
              data BLOB,
              _cursor BIGINT
          );`,
    ).run();

    const sink = sqlite<MockRet>({
      filename: "file:memdb_sqlitesink?mode=memory&cache=shared",
      tableName: "test",
    });
    await run(client, getMockIndexer(), sink);

    const sinkData = db.prepare("SELECT * FROM test").all();

    expect(sinkData).toMatchInlineSnapshot(`
      [
        {
          "_cursor": 5000000,
          "data": "5000000",
        },
        {
          "_cursor": 5000001,
          "data": "5000001",
        },
        {
          "_cursor": 5000002,
          "data": "5000002",
        },
        {
          "_cursor": 5000003,
          "data": "5000003",
        },
        {
          "_cursor": 5000004,
          "data": "5000004",
        },
        {
          "_cursor": 5000005,
          "data": "5000005",
        },
        {
          "_cursor": 5000006,
          "data": "5000006",
        },
        {
          "_cursor": 5000007,
          "data": "5000007",
        },
        {
          "_cursor": 5000008,
          "data": "5000008",
        },
        {
          "_cursor": 5000009,
          "data": "5000009",
        },
      ]
    `);
  });
});
