import { defineCommand } from "citty";
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
    // TODO
  },
});
