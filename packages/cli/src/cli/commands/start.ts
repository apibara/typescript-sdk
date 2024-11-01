import { spawn } from "node:child_process";
import { build, createApibara, prepare, writeTypes } from "apibara/core";
import { runtimeDir } from "apibara/runtime/meta";
import { defineCommand } from "citty";
import { join, resolve } from "pathe";
import { commonArgs } from "../common";

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
  async run({ args }) {
    const rootDir = resolve((args.dir || args._dir || ".") as string);
    const apibara = await createApibara({
      rootDir,
    });

    apibara.logger.start("Building");

    apibara.options.entry = join(runtimeDir, "start.mjs");

    await prepare(apibara);
    await writeTypes(apibara);
    await build(apibara);
    await apibara.close();

    const { indexer, preset } = args;

    const childArgs = [
      resolve(apibara.options.outputDir || "./.apibara/build", "start.mjs"),
      "start",
      "--indexer",
      indexer,
      ...(preset ? ["--preset", preset] : []),
    ];

    spawn("node", childArgs, {
      stdio: "inherit",
    });
  },
});
