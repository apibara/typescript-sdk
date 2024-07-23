import { defaultSink } from "@apibara/indexer";
import { defineConfig } from ".";

export const ApibaraDefaults = defineConfig({
  dev: false,
  rootDir: ".",
  outputDir: "./dist",
  runtimeConfig: {},
  sink: {
    default: defaultSink(),
  },
  hooks: {},
});
