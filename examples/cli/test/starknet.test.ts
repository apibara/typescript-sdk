import { createVcr } from "@apibara/indexer/testing";
import { describe, expect, it } from "vitest";

import Database from "better-sqlite3";
import starknetIndexer from "../indexers/2-starknet.indexer";

const vcr = createVcr();

describe("Starknet indexer", () => {
  it("should work", async () => {
    const databasePath = "/tmp/my-db.sqlite";
    const indexer = starknetIndexer({ databasePath });
    await vcr.run("simple-test", indexer, {
      fromBlock: 800_000n,
      toBlock: 800_005n,
    });

    const database = new Database(databasePath);
    const rows = database.prepare("SELECT * FROM test").all();
    // TODO: update indexer to insert data
    expect(rows).toMatchInlineSnapshot("[]");
  });
});
