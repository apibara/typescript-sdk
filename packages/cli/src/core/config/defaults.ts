// import { defaultSink } from "@apibara/indexer";
import type { ApibaraConfig } from "apibara/types";

export const ApibaraDefaults: ApibaraConfig = {
  rootDir: ".",

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
