import { spawn } from "node:child_process";
import { createApibara } from "apibara/core";
import { defineCommand } from "citty";
import { colors } from "consola/utils";
import fse from "fs-extra";
import { resolve } from "pathe";
import { checkForUnknownArgs, commonArgs } from "../common";

export default defineCommand({
  meta: {
    name: "start",
    description: "Start one indexer",
  },
  args: {
    ...commonArgs,
    indexer: {
      type: "string",
      description: "The indexer to start",
      required: true,
    },
    preset: {
      type: "string",
      description: "The preset to use",
    },
  },
  async run({ args, cmd }) {
    const { indexer, preset } = args;
    const rootDir = resolve((args.dir || args._dir || ".") as string);

    await checkForUnknownArgs(args, cmd);

    const apibara = await createApibara({
      rootDir,
      preset,
    });

    apibara.logger.start(
      `Starting indexer ${indexer}${preset ? ` with preset ${preset}` : ""}`,
    );

    const outputDir = apibara.options.outputDir || "./.apibara/build";
    const entry = resolve(outputDir, "start.mjs");

    if (!fse.existsSync(entry)) {
      apibara.logger.error(
        `Output directory ${outputDir} does not exist. Try building the indexer with "apibara build" first.`,
      );
      return process.exit(1);
    }

    await apibara.close();

    const childArgs = [
      entry,
      "start",
      "--indexer",
      indexer,
      ...(preset ? ["--preset", preset] : []),
    ];

    const childProcess = spawn("node", childArgs, {
      stdio: "inherit",
    });

    childProcess.on("close", (code, signal) => {
      console.log();
      apibara.logger.log(
        `Indexers process exited${
          code !== null ? ` with code ${colors.red(code)}` : ""
        }`,
      );
    });
  },
});
