import fs from "node:fs/promises";
import {
  type MockBlock,
  MockClient,
  type MockFilter,
} from "@apibara/protocol/testing";
import Database from "better-sqlite3";
import { klona } from "klona/full";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { run } from "./indexer";
import { SqlitePersistence, sqlitePersistence } from "./plugins/persistence";
import { generateMockMessages, vcr } from "./testing";
import { type MockRet, getMockIndexer } from "./testing/indexer";

describe("Run Test", () => {
  async function cleanup() {
    try {
      await fs.unlink("file:memdb_indexer?mode=memory&cache=shared");
      await fs.unlink("file:memdb_indexer?mode=memory&cache=shared-wal");
      await fs.unlink("file:memdb_indexer?mode=memory&cache=shared-shm");
    } catch {}
  }

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("should stream messages", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages();
    });

    const sink = vcr<MockRet>();
    await run(client, getMockIndexer(), sink);

    expect(sink.result).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "data": "5000000",
            },
          ],
          "endCursor": {
            "orderKey": 5000000n,
          },
        },
        {
          "data": [
            {
              "data": "5000001",
            },
          ],
          "endCursor": {
            "orderKey": 5000001n,
          },
        },
        {
          "data": [
            {
              "data": "5000002",
            },
          ],
          "endCursor": {
            "orderKey": 5000002n,
          },
        },
        {
          "data": [
            {
              "data": "5000003",
            },
          ],
          "endCursor": {
            "orderKey": 5000003n,
          },
        },
        {
          "data": [
            {
              "data": "5000004",
            },
          ],
          "endCursor": {
            "orderKey": 5000004n,
          },
        },
        {
          "data": [
            {
              "data": "5000005",
            },
          ],
          "endCursor": {
            "orderKey": 5000005n,
          },
        },
        {
          "data": [
            {
              "data": "5000006",
            },
          ],
          "endCursor": {
            "orderKey": 5000006n,
          },
        },
        {
          "data": [
            {
              "data": "5000007",
            },
          ],
          "endCursor": {
            "orderKey": 5000007n,
          },
        },
        {
          "data": [
            {
              "data": "5000008",
            },
          ],
          "endCursor": {
            "orderKey": 5000008n,
          },
        },
        {
          "data": [
            {
              "data": "5000009",
            },
          ],
          "endCursor": {
            "orderKey": 5000009n,
          },
        },
      ]
    `);
  });

  it("factory mode: indexer should merge filters and restart when needed", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      const [_factoryFilter, mainFilter] = request.filter;

      if (Object.keys(mainFilter).length === 0) {
        expect(request.startingCursor?.orderKey).toEqual(100n);

        return [
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 100n },
              endCursor: { orderKey: 101n },
              data: [null, null],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 101n },
              endCursor: { orderKey: 102n },
              data: [null, null],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 102n },
              endCursor: { orderKey: 103n },
              data: [{ data: "B" }, null],
            },
          },
        ];
      }

      if (mainFilter.filter === "B") {
        expect(request.startingCursor?.orderKey).toEqual(102n);

        return [
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 102n },
              endCursor: { orderKey: 103n },
              data: [{ data: "B" }, { data: "103B" }],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 103n },
              endCursor: { orderKey: 104n },
              data: [null, { data: "104B" }],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 104n },
              endCursor: { orderKey: 105n },
              data: [null, { data: "105B" }],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 105n },
              endCursor: { orderKey: 106n },
              data: [{ data: "C" }, { data: "106B" }],
            },
          },
        ];
      }

      if (mainFilter.filter === "BC") {
        expect(request.startingCursor?.orderKey).toEqual(105n);

        return [
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 105n },
              endCursor: { orderKey: 106n },
              data: [{ data: "C" }, { data: "106BC" }],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 106n },
              endCursor: { orderKey: 107n },
              data: [null, { data: "107BC" }],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 107n },
              endCursor: { orderKey: 108n },
              data: [null, { data: "108BC" }],
            },
          },
        ];
      }

      return [];
    });

    const persistence = sqlitePersistence<MockFilter, MockBlock, MockRet>({
      filename: "file:memdb_indexer?mode=memory&cache=shared",
    });

    // create mock indexer with persistence plugin
    const indexer = klona(getMockIndexer([persistence]));
    indexer.options.startingCursor = { orderKey: 100n };
    indexer.options.factory = async (block) => {
      if (block.data === "B") {
        return { filter: { filter: "B" } };
      }

      if (block.data === "C") {
        return { filter: { filter: "C" } };
      }

      return {};
    };

    const sink = vcr<MockRet>();

    await run(client, indexer, sink);

    // open same db again to check last cursor
    const db = Database("file:memdb_indexer?mode=memory&cache=shared");

    const store = new SqlitePersistence<MockFilter>(db);

    const latest = store.get();

    expect(latest.cursor?.orderKey).toEqual(108n);
    expect(latest.filter?.filter).toEqual("BC");

    expect(sink.result).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "data": "103B",
            },
          ],
          "endCursor": {
            "orderKey": 103n,
          },
        },
        {
          "data": [
            {
              "data": "104B",
            },
          ],
          "endCursor": {
            "orderKey": 104n,
          },
        },
        {
          "data": [
            {
              "data": "105B",
            },
          ],
          "endCursor": {
            "orderKey": 105n,
          },
        },
        {
          "data": [
            {
              "data": "106BC",
            },
          ],
          "endCursor": {
            "orderKey": 106n,
          },
        },
        {
          "data": [
            {
              "data": "107BC",
            },
          ],
          "endCursor": {
            "orderKey": 107n,
          },
        },
        {
          "data": [
            {
              "data": "108BC",
            },
          ],
          "endCursor": {
            "orderKey": 108n,
          },
        },
      ]
    `);
  });

  it("factory mode: last cursor should persist when error is thrown in indexer", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      const [_factoryFilter, mainFilter] = request.filter;

      if (Object.keys(mainFilter).length === 0) {
        expect(request.startingCursor?.orderKey).toEqual(100n);

        return [
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 100n },
              endCursor: { orderKey: 101n },
              data: [null, null],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 101n },
              endCursor: { orderKey: 102n },
              data: [null, null],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 102n },
              endCursor: { orderKey: 103n },
              data: [{ data: "B" }, null],
            },
          },
          Error("this error should not occurr!"),
        ];
      }

      if (mainFilter.filter === "B") {
        expect(request.startingCursor?.orderKey).toEqual(102n);

        return [
          Error("this error should occurr!"),
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 103n },
              endCursor: { orderKey: 104n },
              data: [null, { data: "104B" }],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 104n },
              endCursor: { orderKey: 105n },
              data: [null, { data: "105B" }],
            },
          },
          {
            _tag: "data",
            data: {
              finality: "accepted",
              cursor: { orderKey: 105n },
              endCursor: { orderKey: 106n },
              data: [{ data: "C" }, { data: "106B" }],
            },
          },
        ];
      }

      return [];
    });

    const persistence = sqlitePersistence<MockFilter, MockBlock, MockRet>({
      filename: "file:memdb_indexer?mode=memory&cache=shared",
    });

    // create mock indexer with persistence plugin
    const indexer = klona(getMockIndexer([persistence]));
    indexer.options.startingCursor = { orderKey: 100n };
    indexer.options.factory = async (block) => {
      if (block.data === "B") {
        return { filter: { filter: "B" } };
      }

      if (block.data === "C") {
        return { filter: { filter: "C" } };
      }

      return {};
    };

    const sink = vcr<MockRet>();

    await expect(() => run(client, indexer, sink)).rejects.toThrowError(
      "this error should occurr!",
    );

    // open same db again to check last cursor
    const db = Database("file:memdb_indexer?mode=memory&cache=shared");

    const store = new SqlitePersistence<MockFilter>(db);

    const latest = store.get();

    expect(latest.cursor?.orderKey).toEqual(103n);
    expect(latest.filter?.filter).toEqual("B");

    expect(sink.result).toMatchInlineSnapshot("[]");
  });
});
