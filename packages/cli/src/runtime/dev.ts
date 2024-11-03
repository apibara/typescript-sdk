import { run } from "@apibara/indexer";
import { createClient } from "@apibara/protocol";
import { defineCommand, runMain } from "citty";
import { availableIndexers, createIndexer } from "./internal/app";

const startCommand = defineCommand({
  meta: {
    name: "start",
    description: "Start the indexer",
  },
  args: {
    indexers: {
      type: "string",
      description: "Which indexers to run",
    },
    preset: {
      type: "string",
      description: "Preset to use",
    },
  },
  async run({ args }) {
    const { indexers: indexersArgs, preset } = args;

    let selectedIndexers = availableIndexers;
    if (indexersArgs) {
      selectedIndexers = indexersArgs.split(",");
    }

    for (const indexer of selectedIndexers) {
      if (!availableIndexers.includes(indexer)) {
        throw new Error(
          `Specified indexer "${indexer}" but it was not defined`,
        );
      }
    }

    await Promise.all(
      selectedIndexers.map(async (indexer) => {
        const indexerInstance = createIndexer(indexer, preset);

        const client = createClient(
          indexerInstance.streamConfig,
          indexerInstance.options.streamUrl,
        );

        await run(client, indexerInstance);
      }),
    );
  },
});

export const mainCli = defineCommand({
  meta: {
    name: "indexer-dev-runner",
    description: "Run indexer in dev mode",
  },
  subCommands: {
    start: () => startCommand,
  },
});

runMain(mainCli);

export default {};