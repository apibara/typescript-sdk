import { build, createApibara, prepare, writeTypes } from "apibara/core";
import { runtimeDir } from "apibara/runtime/meta";
import { defineCommand } from "citty";
import { join, resolve } from "pathe";
import { checkForUnknownArgs, commonArgs } from "../common";

export default defineCommand({
  meta: {
    name: "build",
    description: "Build indexer",
  },
  args: {
    ...commonArgs,
  },
  async run({ args, cmd }) {
    await checkForUnknownArgs(args, cmd);

    const rootDir = resolve((args.dir || args._dir || ".") as string);

    const apibara = await createApibara({
      rootDir,
    });

    apibara.options.entry = join(runtimeDir, "start.mjs");

    await prepare(apibara);
    await writeTypes(apibara);
    await build(apibara);
    await apibara.close();
  },
});
