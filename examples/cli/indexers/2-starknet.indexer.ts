import { defineIndexer, useSink } from "@apibara/indexer";
import { drizzlePersistence } from "@apibara/indexer/plugins/drizzle-persistence";
import { useLogger } from "@apibara/indexer/plugins/logger";
import { drizzleSink } from "@apibara/indexer/sinks/drizzle";
import { StarknetStream } from "@apibara/starknet";

import type { ApibaraRuntimeConfig } from "apibara/types";
import type {
  ExtractTablesWithRelations,
  TablesRelationalConfig,
} from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { hash } from "starknet";

import { db } from "@/lib/db";
import { starknetUsdcTransfers } from "@/lib/schema";

// USDC Transfers on Starknet
export default function (runtimeConfig: ApibaraRuntimeConfig) {
  return createIndexer({ database: db });
}

export function createIndexer<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>({
  database,
}: {
  database: PgDatabase<TQueryResult, TFullSchema, TSchema>;
}) {
  return defineIndexer(StarknetStream)({
    streamUrl: "https://starknet.preview.apibara.org",
    finality: "accepted",
    startingCursor: {
      orderKey: 800_000n,
    },
    plugins: [
      drizzlePersistence({ database, indexerName: "starknet-usdc-transfers" }),
    ],
    sink: drizzleSink({ database, tables: [starknetUsdcTransfers] }),
    filter: {
      events: [
        {
          address:
            "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8" as `0x${string}`,
          keys: [hash.getSelectorFromName("Transfer") as `0x${string}`],
        },
      ],
    },
    async transform({ endCursor, block, context }) {
      const logger = useLogger();
      const { db } = useSink({ context });
      const { events } = block;

      logger.info("Transforming block ", endCursor?.orderKey);

      const transactionHashes = new Set<string>();

      for (const event of events) {
        if (event.transactionHash) {
          transactionHashes.add(event.transactionHash);
        }
      }

      await db.insert(starknetUsdcTransfers).values(
        Array.from(transactionHashes).map((transactionHash) => ({
          number: Number(endCursor?.orderKey),
          hash: transactionHash,
        })),
      );
    },
  });
}
