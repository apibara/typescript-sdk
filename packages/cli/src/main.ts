import { defineCommand, runMain } from "citty";

const main = defineCommand({
  meta: {
    name: "apibara",
    description: "Apibara CLI",
    version: "2.0.0",
  },
  subCommands: {
    dev: () => import("./commands/dev").then((r) => r.default),
    build: () => import("./commands/build").then((r) => r.default),
    prepare: () => import("./commands/prepare").then((r) => r.default),
  },
});

runMain(main);
