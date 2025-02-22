import { initializeProject } from "apibara/create";
import { defineCommand } from "citty";

export default defineCommand({
  meta: {
    name: "init",
    description: "Initialize a new Apibara project",
  },
  args: {
    dir: {
      type: "positional",
      description: "Target path to initialize the project",
      required: true,
    },
    language: {
      type: "string",
      description: "Language to use: typescript, ts or javascript, js",
      default: "ts",
      alias: "l",
    },
    noIndexer: {
      type: "boolean",
      description: "Do not create an indexer after initialization",
      default: false,
    },
  },
  async run({ args }) {
    const { dir: targetDir, noIndexer, language } = args;

    await initializeProject({
      argTargetDir: targetDir,
      argLanguage: language,
      argNoCreateIndexer: noIndexer,
    });
  },
});
