import { spawn } from "node:child_process";
import { join } from "node:path";
import { build, createApibara, prepare, writeTypes } from "apibara/core";
import { runtimeDir } from "apibara/runtime/meta";
import { defineCommand } from "citty";
import consola from "consola";
import { resolve } from "pathe";
import { checkForUnknownArgs, commonArgs } from "../common";

export default defineCommand({
  meta: {
    name: "write-project-info",
    description: "Write json-encoded information about the project.",
  },
  args: {
    ...commonArgs,
  },
  async run({ args, cmd }) {
    await checkForUnknownArgs(args, cmd);

    consola.start("Generating `project-info.json`");

    const rootDir = resolve((args.dir || ".") as string);
    const apibara = await createApibara({ rootDir, disableLogs: true });

    apibara.options.entry = join(runtimeDir, "project-info.mjs");

    await prepare(apibara);
    await writeTypes(apibara);
    await build(apibara);

    const childArgs = [
      resolve(
        apibara.options.outputDir || "./.apibara/build",
        "project-info.mjs",
      ),
      "start",
      "--build-dir",
      apibara.options.buildDir,
    ];

    const child = spawn("node", childArgs, {
      stdio: "inherit",
    });

    child.on("close", (code) => {
      if (code === 0) {
        consola.success("Project info written to `.apibara/project-info.json`");
      }
    });

    child.on("error", (error) => {
      consola.error(`Failed to write project info: ${error.message}`, error);
    });
  },
});
