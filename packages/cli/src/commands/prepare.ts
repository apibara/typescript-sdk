import { defineCommand } from "citty";
import { resolve } from "pathe";
import { createApibara } from "../apibara";
import { commonArgs } from "../common";
import { writeTypes } from "../core/build/types";

export default defineCommand({
  meta: {
    name: "prepare",
    description: "Generate types for the project",
  },
  args: {
    ...commonArgs,
  },
  async run({ args }) {
    console.log("prepare", args);
    const rootDir = resolve((args.dir || ".") as string);
    const apibara = await createApibara({ rootDir });
    await writeTypes(apibara);
  },
});
