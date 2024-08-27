import { createIndexer, run } from "@apibara/indexer";
import { createClient } from "@apibara/protocol";
import { defineCommand, runMain } from "citty";
import consola from "consola";

import { createIndexerConfig } from "./indexer";

const command = defineCommand({
  meta: {
    name: "example-starknet-indexer",
    version: "1.0.0",
    description: "Example showing how to run an indexer",
  },
  args: {
    stream: {
      type: "string",
      default: "http://mainnet-v2.starknet.a5a.ch:7007",
      description: "Starknet stream URL",
    },
    authToken: {
      type: "string",
      description: "DNA auth token",
    },
  },
  async run({ args }) {
    consola.info("Connecting to Starknet stream", args.stream);

    const indexer = createIndexer(createIndexerConfig(args.stream));
    const client = createClient(
      indexer.streamConfig,
      indexer.options.streamUrl,
    );

    await run(client, indexer);
  },
});

runMain(command);
