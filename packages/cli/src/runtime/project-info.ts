import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getProcessedRuntimeConfig,
  getRuntimeDataFromEnv,
} from "apibara/common";
import { defineCommand, runMain } from "citty";
import { availableIndexers, createIndexer } from "./internal/app";

type ProjectInfo = {
  indexers: {
    [indexerName: string]: {
      [presetName: string]: {
        type: string;
        isFactory: boolean;
      };
    };
  };
};

const startCommand = defineCommand({
  meta: {
    name: "write-project-info",
    description: "Write json-encoded information about the project.",
  },
  args: {
    "build-dir": {
      type: "string",
      description: "project build directory",
    },
  },
  async run({ args }) {
    const projectInfo: ProjectInfo = {
      indexers: {},
    };

    // get all original runtime data from env
    const { presets, runtimeConfig, userEnvRuntimeConfig } =
      getRuntimeDataFromEnv();

    for (const preset of Object.keys(presets ?? {})) {
      // process runtime config for each preset
      const processedRuntimeConfig = getProcessedRuntimeConfig({
        preset,
        presets,
        runtimeConfig,
        userEnvRuntimeConfig,
      });
      for (const indexer of availableIndexers) {
        const { indexer: indexerInstance } =
          createIndexer({
            indexerName: indexer,
            processedRuntimeConfig,
            preset,
          }) ?? {};
        if (!indexerInstance) {
          continue;
        }
        projectInfo.indexers[indexer] = {
          ...(projectInfo.indexers[indexer] ?? {}),
          [preset]: {
            type: indexerInstance.streamConfig.name,
            isFactory: indexerInstance.options.factory !== undefined,
          },
        };
      }
    }

    const projectInfoPath = resolve(
      args["build-dir"] ?? ".apibara",
      "project-info.json",
    );

    writeFileSync(projectInfoPath, JSON.stringify(projectInfo, null, 2));
  },
});

export const mainCli = defineCommand({
  meta: {
    name: "write-project-info-runner",
    description: "Write json-encoded information about the project.",
  },
  subCommands: {
    start: () => startCommand,
  },
});

runMain(mainCli);

export default {};
