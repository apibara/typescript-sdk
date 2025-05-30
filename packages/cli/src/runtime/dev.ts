import { runWithReconnect } from "@apibara/indexer";
import { createAuthenticatedClient } from "@apibara/protocol";
import { getRuntimeDataFromEnv } from "apibara/common";
import { defineCommand, runMain } from "citty";
import { blueBright } from "picocolors";
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
  },
  async run({ args }) {
    const { indexers: indexersArgs } = args;

    const { processedRuntimeConfig, preset } = getRuntimeDataFromEnv();

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
        const { indexer: indexerInstance, logger } =
          createIndexer({
            indexerName: indexer,
            processedRuntimeConfig,
            preset,
          }) ?? {};
        if (!indexerInstance) {
          return;
        }

        const client = createAuthenticatedClient(
          indexerInstance.streamConfig,
          indexerInstance.options.streamUrl,
          indexerInstance.options.clientOptions,
        );

        if (logger) {
          logger.info(`Indexer ${blueBright(indexer)} started`);
        }

        await runWithReconnect(client, indexerInstance);
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
