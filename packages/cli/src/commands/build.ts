import { defineCommand } from "citty";
import { resolve } from "pathe";
import { createApibara } from "../apibara";
import { commonArgs } from "../common";
import { build } from "../core/build/build";
import { prepare } from "../core/build/prepare";

export default defineCommand({
  meta: {
    name: "build",
    description: "Build indexer",
  },
  args: {
    ...commonArgs,
  },
  async run({ args }) {
    const rootDir = resolve((args.dir || args._dir || ".") as string);
    const apibara = await createApibara({
      rootDir,
    });
    await prepare(apibara);
    await build(apibara);
    await apibara.close();
  },
});
