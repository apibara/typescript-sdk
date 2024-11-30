import { defineIndexer, useSink } from "@apibara/indexer";
import { drizzlePersistence } from "@apibara/indexer/plugins/drizzle-persistence";
import { useLogger } from "@apibara/indexer/plugins/logger";
import { sqlite } from "@apibara/indexer/sinks/sqlite";
import { StarknetStream } from "@apibara/starknet";
import type { ApibaraRuntimeConfig } from "apibara/types";
import Database from "better-sqlite3";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { hash } from "starknet";

export default function (runtimeConfig: ApibaraRuntimeConfig) {
  console.log("--> Starknet Indexer Runtime Config: ", runtimeConfig);

  // Sink Database
  const database = new Database(runtimeConfig.databasePath);
  database.exec("DROP TABLE IF EXISTS test");
  database.exec(
    "CREATE TABLE IF NOT EXISTS test (number TEXT, hash TEXT, _cursor BIGINT)",
  );

  // Persistence Database
  const client = new Client({
    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  });
  const persistDatabase = drizzle(client);

  return defineIndexer(StarknetStream)({
    streamUrl: "https://starknet.preview.apibara.org",
    finality: "accepted",
    startingCursor: {
      orderKey: 800_000n,
    },
    plugins: [
      drizzlePersistence({
        database: persistDatabase,
        indexerName: "2-starknet",
      }),
    ],
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
    hooks: {
      async "run:before"() {
        await client.connect();

        // Normally user will do migrations of both tables, which are defined in
        // ```
        // import { checkpoints, filters } from "@apibara/indexer/plugins/drizzle-persistence"
        // ```,
        // but just for quick testing and example we create them here directly

        await persistDatabase.execute(sql`
          CREATE TABLE IF NOT EXISTS checkpoints (
            id TEXT NOT NULL PRIMARY KEY,
            order_key INTEGER NOT NULL,
            unique_key TEXT
          );
      
          CREATE TABLE IF NOT EXISTS filters (
            id TEXT NOT NULL,
            filter TEXT NOT NULL,
            from_block INTEGER NOT NULL,
            to_block INTEGER,
            PRIMARY KEY (id, from_block)
          );
        `);
      },
    },
  });
}
