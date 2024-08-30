import { EvmStream } from "@apibara/evm";
import { defineIndexer, useSink } from "@apibara/indexer";
import { drizzle as drizzleSink } from "@apibara/indexer/sinks/drizzle";
import consola from "consola";
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { encodeEventTopics, parseAbi } from "viem";

const abi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("full_name"),
  phone: varchar("phone", { length: 256 }),
});

export function createIndexerConfig(streamUrl: string) {
  const pgClient = postgres("your_connection_string");
  const db = drizzle(pgClient);

  const sink = drizzleSink({ database: db });

  return defineIndexer(EvmStream)({
    streamUrl,
    finality: "accepted",
    startingCursor: {
      orderKey: 5_000_000n,
    },
    filter: {
      logs: [
        {
          strict: true,
          topics: encodeEventTopics({
            abi,
            eventName: "Transfer",
            args: { from: null, to: null },
          }) as `0x${string}`[],
        },
      ],
    },
    sink,
    async transform({ block: { header }, context }) {
      const { db } = useSink({ context });

      await db.insert(users).values([
        {
          id: Number(header?.number),
          firstName: `John Doe ${Number(header?.number)}`,
          phone: "+91 1234567890",
        },
      ]);

      consola.info("Transforming block", header?.number);
    },
    hooks: {
      "handler:after": ({ endCursor }) => {
        consola.info("Transformed ", endCursor?.orderKey);
      },
    },
    plugins: [],
  });
}
