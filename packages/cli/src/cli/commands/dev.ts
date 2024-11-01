import { type ChildProcess, spawn } from "node:child_process";
import { build, createApibara, prepare, writeTypes } from "apibara/core";
import { runtimeDir } from "apibara/runtime/meta";
import type { Apibara } from "apibara/types";
import { defineCommand } from "citty";
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
    sink: {
      type: "string",
      description: "Sink to use",
    },
  },
  async run({ args }) {
    const rootDir = resolve((args.dir || args._dir || ".") as string);

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

      apibara.hooks.hook("dev:restart", () => {
        if (childProcess) {
          apibara.logger.info("Change detected, stopping indexers to restart");
          childProcess.kill();
          childProcess = undefined;
        }
      });

      apibara.hooks.hook("dev:reload", () => {
        if (childProcess) {
          childProcess.kill();
        } else {
          apibara.logger.success("Restarting indexers");
        }

        const childArgs = [
          resolve(apibara.options.outputDir || "./.apibara/build", "dev.mjs"),
          "start",
          ...(args.indexers ? ["--indexers", args.indexers] : []),
          ...(args.preset ? ["--preset", args.preset] : []),
          ...(args.sink ? ["--sink", args.sink] : []),
        ];

        childProcess = spawn("node", childArgs, {
          stdio: "inherit",
        });

        childProcess.on("close", (code) => {
          if (code !== null) {
            apibara.logger.log(`Indexers process exited with code ${code}`);
          }
        });
      });
    };

    await reload();
  },
});
