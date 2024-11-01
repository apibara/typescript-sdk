import { defineCommand, runMain } from "citty";

export const mainCli = defineCommand({
  meta: {
    name: "apibara",
    description: "Apibara CLI",
    version: "2.0.0",
  },
  subCommands: {
    dev: () => import("./commands/dev").then((r) => r.default),
    build: () => import("./commands/build").then((r) => r.default),
    start: () => import("./commands/start").then((r) => r.default),
    prepare: () => import("./commands/prepare").then((r) => r.default),
  },
});

runMain(mainCli);
