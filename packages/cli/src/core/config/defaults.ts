// import { defaultSink } from "@apibara/indexer";
import { type ApibaraConfig } from "apibara/types";

export const ApibaraDefaults: ApibaraConfig = {
  rootDir: ".",
  outputDir: "./dist",
  runtimeConfig: {},
  // sink: {
  //   // default: () => defaultSink(),
  // },
  hooks: {},
};
