import {
  type MockBlock,
  MockClient,
  type MockFilter,
} from "@apibara/protocol/testing";
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { run } from "../indexer";
import { generateMockMessages, getMockIndexer } from "../internal/testing";
import { useSink } from "../sink";
import { sqlite } from "./sqlite";

describe("Run Test", () => {
  it("should store in sqlite db via sqlitesink", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages();
    });

    const db = new Database(":memory:");

    db.prepare("DROP TABLE IF EXISTS test;").run();

    db.prepare(
      `
        CREATE TABLE IF NOT EXISTS test (
              data BLOB,
              _cursor BIGINT
          );`,
    ).run();

    const sink = sqlite({
      database: db,
      tableName: "test",
    });
    await run(
      client,
      getMockIndexer({
        sink,
        override: {
          transform: async ({ context, endCursor, block: { data } }) => {
            const { writer } = useSink({ context });
            writer.insert([{ data }]);
          },
        },
      }),
    );

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

    db.close();
  });
});
