import { createIndexer, run } from "@apibara/indexer";
import { createClient } from "@apibara/protocol";
import { defineCommand, runMain } from "citty";
import consola from "consola";

import { createIndexerConfig } from "./indexer";

import "./instrumentation";
import { drizzle as drizzleSink } from "@apibara/indexer/sinks/drizzle";
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const command = defineCommand({
  meta: {
    name: "example-indexer",
    version: "1.0.0",
    description: "Example showing how to run an indexer",
  },
  args: {
    stream: {
      type: "string",
      default: "https://sepolia.ethereum.a5a.ch",
      description: "EVM stream URL",
    },
    authToken: {
      type: "string",
      description: "DNA auth token",
    },
  },
  async run({ args }) {
    consola.info("Connecting to EVM stream", args.stream);

    const indexer = createIndexer(createIndexerConfig(args.stream));
    const client = createClient(
      indexer.streamConfig,
      indexer.options.streamUrl,
    );

    /** TEMPORARY EXAMPLE OF DRIZZLE SINK - WILL BE REMOVED */
    const users = pgTable("users", {
      id: serial("id").primaryKey(),
      fullName: text("full_name"),
      phone: varchar("phone", { length: 256 }),
    });

    const pgClient = postgres("your_connection_string");
    const db = drizzle(pgClient);

    const sink = drizzleSink({ database: db, table: users });

    // Demo of how we can infer type for the transform function
    async function _transform(): typeof sink.$inferTransform {
      return [{ id: 1, fullName: "John Doe", phone: "1234567890" }];
    }

    await run(client, indexer, sink);
  },
});

runMain(command);
