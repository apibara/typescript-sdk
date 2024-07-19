import { defineCommand } from "citty";
import { resolve } from "pathe";
import { createApibara } from "../apibara";
import { writeTypes } from "../build/types";
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
    const rootDir = resolve((args.dir || ".") as string);
    const apibara = await createApibara({ rootDir });
    await writeTypes(apibara);
  },
});
