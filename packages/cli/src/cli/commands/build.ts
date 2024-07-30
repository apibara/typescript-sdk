import { build, createApibara, prepare } from "apibara/core";
import { defineCommand } from "citty";
import consola from "consola";
import { resolve } from "pathe";
import { commonArgs } from "../common";

export default defineCommand({
  meta: {
    name: "build",
    description: "Build indexer",
  },
  args: {
    ...commonArgs,
  },
  async run({ args }) {
    consola.info("Building with args", args);
    const rootDir = resolve((args.dir || args._dir || ".") as string);
    const apibara = await createApibara({
      rootDir,
    });
    await prepare(apibara);
    await build(apibara);
    await apibara.close();
  },
});
