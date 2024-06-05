import { runMain, defineCommand } from "citty";
import consola from "consola";
import { createClient } from "@apibara/protocol";
import { createIndexer, run } from "@apibara/indexer";
import { createIndexerConfig } from "./indexer";

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

    await run(client, indexer);
  },
});

runMain(command);
