import { defineCommand } from "citty";
import { resolve } from "pathe";
import { createApibara, build, prepare } from "apibara/core";
import { commonArgs } from "../common";
import consola from "consola";

export default defineCommand({
  meta: {
    name: "build",
    description: "Build indexer",
  },
  args: {
    ...commonArgs,
  },
  async run({ args }) {
    consola.info("build", args);
    const rootDir = resolve((args.dir || args._dir || ".") as string);
    const apibara = await createApibara({
      rootDir,
    });
    consola.info("apibara", apibara);
    await prepare(apibara);
    await build(apibara);
    await apibara.close();
  },
});
