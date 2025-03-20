import { createVcr } from "@apibara/indexer/testing";
import { describe, expect, it } from "vitest";

import createIndexer from "@/indexers/2-starknet.indexer";

import { starknetUsdcTransfers } from "@/lib/schema";
import { getTestDatabase } from "@apibara/plugin-drizzle/testing";

const vcr = createVcr();

describe("Starknet USDC Transfers indexer", () => {
  it("should work", async () => {
    const indexer = createIndexer({
      evm: { startingBlock: 10_000_000 },
      starknet: { startingBlock: 800_000 },
    });

    const testResult = await vcr.run("starknet-usdc-transfers", indexer, {
      fromBlock: 800_000n,
      toBlock: 800_005n,
    });

    const database = getTestDatabase(testResult);

    const rows = await database.select().from(starknetUsdcTransfers);

    expect(rows.map(({ _id, ...rest }) => rest)).toMatchInlineSnapshot(`
      [
        {
          "hash": "0x006dcfffad0aebb8e496bf1af95b97ab181e9b86bd61a07c2926407ea70c0d0e",
          "number": 800001,
        },
        {
          "hash": "0x07b2c7d48d92eb6110b5039a112110b4ee5b59b9249764d22441c988f2a3730d",
          "number": 800002,
        },
        {
          "hash": "0x0288e4f00a93f4ea8f61bc0c218df8070c2a4ecd219e18a8fe39d473e62dff08",
          "number": 800002,
        },
        {
          "hash": "0x029959d46cfadb2b0c8cc823a9e4c03b7f22f8c596c424c9e11db62ee7fa96ba",
          "number": 800002,
        },
        {
          "hash": "0x0247f793e0525ed7d9d369b1b701942e55c4d41a3116733f0c77af3c0dfd21ad",
          "number": 800002,
        },
        {
          "hash": "0x06683c568f2e977e3d4b6f4da70b3926950c83f5a7c6119b3f2a643643db8fed",
          "number": 800002,
        },
        {
          "hash": "0x041a41f4fdda921c6049188312aaaa28f63e6bb628d6dd604891449d4d76b395",
          "number": 800002,
        },
        {
          "hash": "0x0393e0fbc25313322c088d5d457961f72bf6f6f31cc846f3e8aa96c1e53922c3",
          "number": 800002,
        },
        {
          "hash": "0x05042aeb03be2ec2ae48d78dcc69e9d79221807cc70eedcf083db70adfd88eac",
          "number": 800002,
        },
        {
          "hash": "0x06ecfe783686b0dc2747acfcc77e7dcda2b2baea6e65bc8624537e14ca024343",
          "number": 800002,
        },
        {
          "hash": "0x0359aeed2843c282006cff7326fdce682efd3e6c43170df8fad02f1e0d1a9446",
          "number": 800003,
        },
        {
          "hash": "0x0725361f6a2bafeb496b0b879ed7711d8ae3afd9dfd973bfac97ff0e3cb0cd4b",
          "number": 800004,
        },
        {
          "hash": "0x079bdefcacc75dd1db6dfcdf3b29e9c30d2b70002d9d85a3d1b2032e2c72251c",
          "number": 800005,
        },
      ]
    `);
  });
});
