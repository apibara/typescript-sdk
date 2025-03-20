import { createVcr } from "@apibara/indexer/testing";

import createIndexer from "@/indexers/1-evm.indexer";
import { ethereumUsdcTransfers } from "@/lib/schema";
import { getTestDatabase } from "@apibara/plugin-drizzle/testing";
import { describe, expect, it } from "vitest";

const vcr = createVcr();

describe("Ethereum USDC Transfers indexer", () => {
  it("should work", async () => {
    const indexer = createIndexer({
      evm: { startingBlock: 10_000_000 },
      starknet: { startingBlock: 800_000 },
    });

    const testResult = await vcr.run("ethereum-usdc-transfers", indexer, {
      fromBlock: 10_000_000n,
      toBlock: 10_000_005n,
    });

    const database = getTestDatabase(testResult);

    const rows = await database.select().from(ethereumUsdcTransfers);

    expect(rows.map(({ _id, ...rest }) => rest)).toMatchInlineSnapshot(`
      [
        {
          "hash": "0xfc80de5a3b766eece5c5a7f7858a9d537a8fefa8186c71fa7766a2bae939b816",
          "number": 10000001,
        },
        {
          "hash": "0x8a38d2a2de4821f6d13d393c364fced4b0280dc66976cd43b7f9c3dd4aeebae6",
          "number": 10000001,
        },
        {
          "hash": "0xa20537a561c41855e6719f687d060217cfe105f6314c2facd68accbb197b7a72",
          "number": 10000002,
        },
        {
          "hash": "0xec921d30995ee6e19c67712d264311fffc1936262d6bc99db44e93682866838f",
          "number": 10000002,
        },
        {
          "hash": "0x2894671b55148dc194b9ad859ca231fa3ff8a7e0a3cde2e5c7bb21915a448104",
          "number": 10000003,
        },
        {
          "hash": "0x77b58d6769d43bd21379dea89d65bd860127753de7e7b607cec267d4ddcbf9c6",
          "number": 10000003,
        },
        {
          "hash": "0x46d3e295575268ddb5cb778d52dd2b2f66e6e4dc984bdaa1b3ae8459d3c0ccb3",
          "number": 10000003,
        },
        {
          "hash": "0x0862e1e01a91390133574765808540617de4dc3faf66c3acc6b45fe3eb478b0d",
          "number": 10000003,
        },
        {
          "hash": "0xd50111f6b29419d975446d9f1ce05386f4778a1532ab43267e88f33fb71e01e2",
          "number": 10000005,
        },
      ]
    `);
  });
});
