import { defineCommand } from "citty";
import { commonArgs } from "../common";
import consola from "consola";

export default defineCommand({
  meta: {
    name: "dev",
    description: "Start the development server",
  },
  args: {
    ...commonArgs,
  },
  async run({ args }) {
    // TODO
    consola.info("dev", args);
  },
});
