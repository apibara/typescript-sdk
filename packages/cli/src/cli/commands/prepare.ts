import { checkForUnknownArgs, commonArgs } from "apibara/common";
import { createApibara, writeTypes } from "apibara/core";
import { defineCommand } from "citty";
import { resolve } from "pathe";

export default defineCommand({
  meta: {
    name: "prepare",
    description: "Generate types for the project",
  },
  args: {
    ...commonArgs,
  },
  async run({ args, cmd }) {
    await checkForUnknownArgs(args, cmd);

    const rootDir = resolve((args.dir || ".") as string);
    const apibara = await createApibara({ rootDir });
    await writeTypes(apibara);
  },
});
