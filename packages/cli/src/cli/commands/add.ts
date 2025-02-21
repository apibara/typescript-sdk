import { addIndexer } from "apibara/create";
import { defineCommand } from "citty";

export default defineCommand({
  meta: {
    name: "add",
    description:
      "apibara add helps you add a new indexer to your project with sensible defaults.",
  },
  args: {
    indexerId: {
      type: "positional",
      description: "Indexer ID",
      required: false,
    },
    chain: {
      type: "string",
      description: "Chain",
    },
    network: {
      type: "string",
      description: "Network",
    },
    storage: {
      type: "string",
      description: "Storage",
    },
    dnaUrl: {
      type: "string",
      description: "DNA URL",
    },
  },
  async run({ args }) {
    const { indexerId, chain, network, storage, dnaUrl } = args;

    await addIndexer({
      argIndexerId: indexerId,
      argChain: chain,
      argNetwork: network,
      argStorage: storage,
      argDnaUrl: dnaUrl,
    });
  },
});
