import { defineIndexer } from "@apibara/indexer";
import { drizzleStorage, useDrizzleStorage } from "@apibara/plugin-drizzle";
import { drizzle } from "@apibara/plugin-drizzle";
import { StarknetStream } from "@apibara/starknet";

import { starknetUsdcTransfers } from "@/lib/schema";
import { useLogger } from "@apibara/indexer/plugins";
import type { ApibaraRuntimeConfig } from "apibara/types";
import { hash } from "starknet";

// USDC Transfers on Starknet
export default function (runtimeConfig: ApibaraRuntimeConfig) {
  const {
    starknet: { startingBlock },
  } = runtimeConfig;

  // connectionString defaults to process.env["POSTGRES_CONNECTION_STRING"](postgresql) ?? "memory://" (in memory pglite)
  const database = drizzle({
    schema: {
      starknetUsdcTransfers,
    },
  });

  return defineIndexer(StarknetStream)({
    streamUrl: "https://starknet.preview.apibara.org",
    finality: "accepted",
    startingBlock: BigInt(startingBlock),
    plugins: [
      drizzleStorage({
        db: database,
        idColumn: {
          "*": "_id",
        },
        persistState: true,
        indexerName: "starknet-usdc-transfers",
        migrate: {
          migrationsFolder: "./drizzle",
        },
      }),
    ],
    filter: {
      events: [
        {
          address:
            "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8" as `0x${string}`,
          keys: [hash.getSelectorFromName("Transfer") as `0x${string}`],
        },
      ],
    },
    async transform({ endCursor, block, context, finality }) {
      const logger = useLogger();
      const { db } = useDrizzleStorage();
      const { events } = block;

      logger.info(
        "Transforming block | orderKey: ",
        endCursor?.orderKey,
        " | finality: ",
        finality,
      );

      const transactionHashes = new Set<string>();

      for (const event of events) {
        if (event.transactionHash) {
          transactionHashes.add(event.transactionHash);
        }
      }

      await db.insert(starknetUsdcTransfers).values(
        Array.from(transactionHashes)
          .map((transactionHash) => ({
            number: Number(endCursor?.orderKey),
            hash: transactionHash,
          }))
          .filter(
            ({ number }) => number !== undefined && !Number.isNaN(number),
          ),
      );
    },
  });
}
