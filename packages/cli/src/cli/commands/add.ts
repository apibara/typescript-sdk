import { addIndexer } from "apibara/create";
import { defineCommand } from "citty";
import { checkForUnknownArgs } from "../common";

export default defineCommand({
  meta: {
    name: "add",
    description:
      "apibara add helps you add a new indexer to your project with sensible defaults.",
  },
  args: {
    indexerId: {
      type: "positional",
      description: "Indexer ID - must be in kebab-case",
      required: false,
    },
    chain: {
      type: "string",
      description: "Blockchain - ethereum, beaconchain, starknet",
    },
    network: {
      type: "string",
      description: "Network - mainnet, sepolia, other",
    },
    storage: {
      type: "string",
      description: "Storage - postgres, none",
    },
    dnaUrl: {
      type: "string",
      description: "DNA URL - https://custom-dna-url.apibara.org",
    },
    dir: {
      type: "string",
      description:
        "Root directory - apibara project root where apibara.config is located | default: current working directory",
    },
  },
  async run({ args, cmd }) {
    await checkForUnknownArgs(args, cmd);

    const { indexerId, chain, network, storage, dnaUrl, dir } = args;

    await addIndexer({
      argIndexerId: indexerId,
      argChain: chain,
      argNetwork: network,
      argStorage: storage,
      argDnaUrl: dnaUrl,
      argRootDir: dir,
    });
  },
});
