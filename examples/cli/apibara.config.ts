import { defaultSink } from "@apibara/indexer";
import { defineConfig } from "apibara/config";

export default defineConfig({
  runtimeConfig: {
    test: 123,
    check: "something",
  },
  presets: {
    dev: {
      runtimeConfig: {
        test: 999,
      },
    },
  },
  sink: {
    default: () => defaultSink(),
  },
});
