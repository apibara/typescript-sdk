import { type ChildProcess, spawn } from "node:child_process";
import { build, createApibara, prepare, writeTypes } from "apibara/core";
import type { Apibara } from "apibara/types";
import { defineCommand } from "citty";
import consola from "consola";
import { resolve } from "pathe";
import { commonArgs } from "../common";

// Hot module reloading key regex
// for only runtimeConfig.* keys
const hmrKeyRe = /^runtimeConfig\./;

let childProcess: ChildProcess | undefined;

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
    consola.start("Starting dev server");
    const rootDir = resolve((args.dir || args._dir || ".") as string);
    let apibara: Apibara;

    const reload = async () => {
      if (apibara) {
        consola.info("Restarting dev server");
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

              consola.info(
                `Nitro config updated:
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

      await writeTypes(apibara);
      await prepare(apibara);
      await build(apibara);

      apibara.hooks.hook("dev:reload", () => {
        if (childProcess) {
          consola.start("Restarting indexers");
          childProcess.kill();
        } else {
          consola.success("Dev server started");
          consola.success("Starting indexers");
        }

        const childArgs = [
          resolve(apibara.options.outputDir || "./.apibara/build", "main.mjs"),
          ...(args.indexers ? ["--indexers", args.indexers] : []),
          ...(args.preset ? ["--preset", args.preset] : []),
          ...(args.sink ? ["--sink", args.sink] : []),
        ];

        childProcess = spawn("jiti", childArgs, {
          stdio: "inherit",
        });

        childProcess.on("close", (code) => {
          if (code !== null) {
            consola.log(`Indexers process exited with code ${code}`);
          }
        });
      });
    };

    await reload();
  },
});
