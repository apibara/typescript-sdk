import { EvmStream } from "@apibara/evm";
import { defineIndexer, useSink } from "@apibara/indexer";
import { drizzlePersistence } from "@apibara/indexer/plugins/drizzle-persistence";
import { useLogger } from "@apibara/indexer/plugins/logger";
import { drizzle as drizzleSink } from "@apibara/indexer/sinks/drizzle";

import type { ApibaraRuntimeConfig } from "apibara/types";
import type {
  ExtractTablesWithRelations,
  TablesRelationalConfig,
} from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { encodeEventTopics, parseAbi } from "viem";

import { db } from "@/lib/db";
import { ethereumUsdcTransfers } from "@/lib/schema";

const abi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

// USDC Transfers on Ethereum
export default function (runtimeConfig: ApibaraRuntimeConfig) {
  return createIndexer({
    database: db,
  });
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
  return defineIndexer(EvmStream)({
    streamUrl: "https://ethereum.preview.apibara.org",
    finality: "accepted",
    startingCursor: {
      orderKey: 10_000_000n,
    },
    filter: {
      logs: [
        {
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          topics: encodeEventTopics({
            abi,
            eventName: "Transfer",
            args: { from: null, to: null },
          }) as `0x${string}`[],
          strict: true,
        },
      ],
    },
    plugins: [
      drizzlePersistence({ database, indexerName: "evm-usdc-transfers" }),
    ],
    sink: drizzleSink({
      database,
      tables: [ethereumUsdcTransfers],
    }),
    async transform({ endCursor, context, block }) {
      const logger = useLogger();
      const { db } = useSink({ context });
      const { logs } = block;

      logger.info("Transforming block ", endCursor?.orderKey);

      for (const log of logs) {
        await db.insert(ethereumUsdcTransfers).values({
          number: Number(endCursor?.orderKey),
          hash: log.transactionHash,
        });
      }
    },
  });
}
