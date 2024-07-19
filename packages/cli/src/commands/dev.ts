import { defineCommand } from "citty";
import { commonArgs } from "../common";

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
  },
});
