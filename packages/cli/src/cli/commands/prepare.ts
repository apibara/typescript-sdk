import { createApibara, writeTypes } from "apibara/core";
import {} from "apibara/types";
import { defineCommand } from "citty";
import consola from "consola";
import { resolve } from "pathe";
import { commonArgs } from "../common";

export default defineCommand({
  meta: {
    name: "prepare",
    description: "Generate types for the project",
  },
  args: {
    ...commonArgs,
  },
  async run({ args }) {
    consola.start("Prepairing Types");
    const rootDir = resolve((args.dir || ".") as string);
    const apibara = await createApibara({ rootDir });
    await writeTypes(apibara);
  },
});
