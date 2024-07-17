import fs from "node:fs/promises";
import {
  type MockBlock,
  MockClient,
  type MockFilter,
} from "@apibara/protocol/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { run } from "../indexer";
import {} from "../plugins/persistence";
import { generateMockMessages } from "../testing";
import { type MockRet, getMockIndexer } from "../testing/indexer";
import { csv } from "./csv";

describe("Run Test", () => {
  async function cleanup() {
    try {
      await fs.unlink("test.csv");
    } catch {}
  }

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("should store in csv file via csv sink", async () => {
    const client = new MockClient<MockFilter, MockBlock>((request, options) => {
      return generateMockMessages();
    });

    const sink = csv<MockRet>({ filepath: "test.csv" });
    await run(client, getMockIndexer(), sink);

    const csvData = await fs.readFile("test.csv", "utf-8");

    expect(csvData).toMatchInlineSnapshot(`
      "5000000,5000000
      5000001,5000001
      5000002,5000002
      5000003,5000003
      5000004,5000004
      5000005,5000005
      5000006,5000006
      5000007,5000007
      5000008,5000008
      5000009,5000009
      "
    `);
  });
});
