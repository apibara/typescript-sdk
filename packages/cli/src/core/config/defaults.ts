import type { ApibaraConfig } from "apibara/types";

export const ApibaraDefaults: ApibaraConfig = {
  rootDir: ".",
  indexersDir: "indexers",

  runtimeConfig: {},
  hooks: {},

  buildDir: ".apibara",

  typescript: {
    strict: false,
    generateRuntimeConfigTypes: true,
    internalPaths: false,
  },

  node: true,
  exportConditions: ["node"],
};
