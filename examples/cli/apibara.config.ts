import { defineConfig } from "@apibara/cli";
import { defaultSink } from "@apibara/indexer";

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
