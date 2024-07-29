import { defaultSink } from "@apibara/indexer";
import { defineConfig } from "../config";

export const ApibaraDefaults = defineConfig({
  rootDir: ".",
  outputDir: "./dist",
  runtimeConfig: {},
  sink: {
    default: () => defaultSink(),
  },
  hooks: {},
});
