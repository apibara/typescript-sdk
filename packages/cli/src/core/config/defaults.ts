import type { ApibaraConfig } from "apibara/types";

export const ApibaraDefaults: ApibaraConfig = {
  rootDir: ".",
  indexersDir: "indexers",

  runtimeConfig: {},
  hooks: {},

  buildDir: ".apibara",

  typescript: {
    strict: false,
    generateTsConfig: true,
    generateRuntimeConfigTypes: true,
    tsconfigPath: "types/tsconfig.json",
    internalPaths: false,
    tsConfig: {},
  },
};
