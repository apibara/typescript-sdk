import { createApibara, writeTypes } from "apibara/core";
import {} from "apibara/types";
import { defineCommand } from "citty";
import consola from "consola";
import { resolve } from "pathe";
// import { createApibara } from "../../apibara";
import { commonArgs } from "../common";
// import { writeTypes } from "../../core/build/types";

export default defineCommand({
  meta: {
    name: "prepare",
    description: "Generate types for the project",
  },
  args: {
    ...commonArgs,
  },
  async run({ args }) {
    consola.info("Prepairing \n\n");
    const rootDir = resolve((args.dir || ".") as string);
    const apibara = await createApibara({ rootDir });
    await writeTypes(apibara);
  },
});
