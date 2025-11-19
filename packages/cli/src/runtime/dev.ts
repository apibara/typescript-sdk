import { ReloadIndexerRequest, runWithReconnect } from "@apibara/indexer";
import { createAuthenticatedClient } from "@apibara/protocol";
import { getRuntimeDataFromEnv } from "apibara/common";
import { defineCommand, runMain } from "citty";
import type { ConsolaInstance } from "consola";
import { blueBright } from "picocolors";
import { availableIndexers, createIndexer } from "./internal/app";

async function startIndexer(indexer: string) {
  let _logger: ConsolaInstance | undefined;
  while (true) {
    try {
      const { processedRuntimeConfig, preset } = getRuntimeDataFromEnv();

      const { indexer: indexerInstance, logger } =
        (await createIndexer({
          indexerName: indexer,
          processedRuntimeConfig,
          preset,
        })) ?? {};

      _logger = logger;

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

      return;
    } catch (error) {
      if (error instanceof ReloadIndexerRequest) {
        _logger?.info(`Indexer ${blueBright(indexer)} reloaded`);
        continue;
      }
      throw error;
    }
  }
}

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

    await Promise.all(selectedIndexers.map((indexer) => startIndexer(indexer)));
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
