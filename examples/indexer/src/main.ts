import { runMain, defineCommand } from "citty";
import consola from "consola";
import { createIndexer } from "./indexer";

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

    const indexer = createIndexer(args.stream);
    console.log(indexer);
  },
});

runMain(command);
