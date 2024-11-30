import { defineIndexer, useSink } from "@apibara/indexer";
import { useLogger } from "@apibara/indexer/plugins/logger";
import { sqlite } from "@apibara/indexer/sinks/sqlite";
import { StarknetStream } from "@apibara/starknet";
import type { ApibaraRuntimeConfig } from "apibara/types";
import Database from "better-sqlite3";
import { hash } from "starknet";

export default function (runtimeConfig: ApibaraRuntimeConfig) {
  console.log("--> Starknet Indexer Runtime Config: ", runtimeConfig);
  const database = new Database(runtimeConfig.databasePath);

  database.exec("DROP TABLE IF EXISTS test");
  database.exec(
    "CREATE TABLE IF NOT EXISTS test (number TEXT, hash TEXT, _cursor BIGINT)",
  );

  return defineIndexer(StarknetStream)({
    streamUrl: "https://starknet.preview.apibara.org",
    finality: "accepted",
    startingCursor: {
      orderKey: 800_000n,
    },
    sink: sqlite({ database, tableName: "test" }),
    filter: {
      events: [
        {
          address:
            "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7" as `0x${string}`,
          keys: [hash.getSelectorFromName("Transfer") as `0x${string}`],
          includeReceipt: true,
        },
      ],
    },
    async transform({ endCursor, block: { header }, context }) {
      const logger = useLogger();
      logger.info("Transforming block ", endCursor?.orderKey);
      const { writer } = useSink({ context });

      // writer.insert([{
      //   number: header?.blockNumber.toString(),
      //   hash: header?.blockHash,
      // }])
    },
  });
}
