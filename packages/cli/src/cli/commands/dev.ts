import { type ChildProcess, spawn } from "node:child_process";
import { build, createApibara, prepare, writeTypes } from "apibara/core";
import { runtimeDir } from "apibara/runtime/meta";
import type { Apibara } from "apibara/types";
import { defineCommand } from "citty";
import { colors } from "consola/utils";
import { join, resolve } from "pathe";
import { commonArgs } from "../common";

// Hot module reloading key regex
// for only runtimeConfig.* keys
const hmrKeyRe = /^runtimeConfig\./;

export default defineCommand({
  meta: {
    name: "dev",
    description: "Start the development server",
  },
  args: {
    ...commonArgs,
    indexers: {
      type: "string",
      description: "Comma-separated list of indexers to run",
    },
    preset: {
      type: "string",
      description: "Preset to use",
    },
    alwaysReindex: {
      type: "boolean",
      default: false,
      description:
        "Reindex the indexers from the starting block on every restart (default: false)",
    },
  },
  async run({ args }) {
    const rootDir = resolve((args.dir || args._dir || ".") as string);

    if (args.alwaysReindex) {
      process.env.APIBARA_ALWAYS_REINDEX = "true";
    }

    let apibara: Apibara;
    let childProcess: ChildProcess | undefined;

    const reload = async () => {
      if (apibara) {
        apibara.logger.info("Restarting dev server");
        if ("unwatch" in apibara.options._c12) {
          await apibara.options._c12.unwatch();
        }

        await apibara.close();
      }

      apibara = await createApibara(
        {
          rootDir,
        },
        {
          watch: true,
          c12: {
            async onUpdate({ getDiff, newConfig }) {
              const diff = getDiff();

              if (diff.length === 0) {
                return; // No changes
              }

              apibara.logger.info(
                `Config updated:
                  ${diff.map((entry) => `  ${entry.toString()}`).join("\n")}`,
              );

              await (diff.every((e) => hmrKeyRe.test(e.key))
                ? apibara.updateConfig(newConfig.config || {}) // Hot reload
                : reload()); // Full reload
            },
          },
        },
        true,
      );

      apibara.hooks.hookOnce("restart", reload);

      apibara.options.entry = join(runtimeDir, "dev.mjs");

      await prepare(apibara);
      await writeTypes(apibara);
      await build(apibara);

      apibara.hooks.hook("dev:restart", async () => {
        if (childProcess) {
          apibara.logger.info("Change detected, stopping indexers to restart");
          await killProcess(childProcess);
          childProcess = undefined;
        }
      });

      apibara.hooks.hook("dev:reload", async () => {
        if (childProcess) {
          apibara.logger.info("Restarting indexers");
          await killProcess(childProcess);
          childProcess = undefined;
        } else {
          apibara.logger.info("Starting indexers");
        }

        const childArgs = [
          resolve(apibara.options.outputDir || "./.apibara/build", "dev.mjs"),
          "start",
          ...(args.indexers ? ["--indexers", args.indexers] : []),
          ...(args.preset ? ["--preset", args.preset] : []),
        ];

        childProcess = spawn("node", childArgs, {
          stdio: "inherit",
        });

        childProcess.on("close", (code) => {
          if (code !== null) {
            apibara.logger.log(
              `Indexers process exited with code ${colors.red(code)}`,
            );
          }
        });
      });
    };

    await reload();
  },
});

async function killProcess(childProcess: ChildProcess | undefined) {
  if (childProcess) {
    await new Promise((resolve) => {
      childProcess.once("exit", resolve);
      childProcess.kill();
    });
  }
}
