import { defineIndexer, useSink } from "@apibara/indexer";
import {
  drizzle as drizzleSink,
  pgIndexerTable,
} from "@apibara/indexer/sinks/drizzle";
import { StarknetStream } from "@apibara/starknet";
import consola from "consola";
import { bigint } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const headers = pgIndexerTable("headers", {
  number: bigint("number", { mode: "bigint" }),
});

export function createIndexerConfig(streamUrl: string) {
  const pgClient = postgres(
    "postgresql://postgres.......supabase.com:6543/postgres",
    { prepare: false },
  );
  const db = drizzle(pgClient);

  const sink = drizzleSink({ database: db, tables: [headers] });

  return defineIndexer(StarknetStream)({
    streamUrl,
    finality: "accepted",
    startingCursor: {
      orderKey: 80_000n,
    },
    filter: {
      events: [
        {
          address:
            "0x00000005dd3D2F4429AF886cD1a3b08289DBcEa99A294197E9eB43b0e0325b4b",
          includeReceipt: true,
          includeTransaction: true,
        },
      ],
    },
    sink,
    async transform({ block: { header }, context }) {
      consola.info("Transforming block ", header?.blockNumber);

      const { db } = useSink({ context });

      await db.insert(headers).values([
        {
          number: header?.blockNumber,
        },
      ]);

      consola.info("Inserted Data ", header?.blockNumber);
    },
  });
}
