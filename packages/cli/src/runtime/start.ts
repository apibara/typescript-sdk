import { runWithReconnect } from "@apibara/indexer";
import { defineCommand, runMain } from "citty";
import consola from "consola";
import { register } from "#apibara-internal-virtual/instrumentation";
import { createAuthenticatedClient, createIndexer } from "./internal/app";

const startCommand = defineCommand({
  meta: {
    name: "start",
    description: "Start the indexer",
  },
  args: {
    indexer: {
      type: "string",
      description: "Indexer name",
      required: true,
    },
    preset: {
      type: "string",
      description: "Preset to use",
    },
  },
  async run({ args }) {
    const { indexer, preset } = args;

    const indexerInstance = createIndexer(indexer, preset);
    if (!indexerInstance) {
      consola.error(`Specified indexer "${indexer}" but it was not defined`);
      process.exit(1);
    }

    const client = createAuthenticatedClient(
      indexerInstance.streamConfig,
      indexerInstance.options.streamUrl,
    );

    if (register) {
      consola.start("Registering from instrumentation");
      await register();
      consola.success("Registered from instrumentation");
    }

    await runWithReconnect(client, indexerInstance);
  },
});

export const mainCli = defineCommand({
  meta: {
    name: "indexer-runner",
    description: "Run an indexer",
  },
  subCommands: {
    start: () => startCommand,
  },
});

runMain(mainCli);

export default {};
