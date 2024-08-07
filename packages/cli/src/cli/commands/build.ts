import { build, createApibara, prepare, writeTypes } from "apibara/core";
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
    consola.start("Building");
    const rootDir = resolve((args.dir || args._dir || ".") as string);
    const apibara = await createApibara({
      rootDir,
    });
    await prepare(apibara);
    await writeTypes(apibara);
    await build(apibara);
    await apibara.close();
  },
});
