import { defineConfig } from "apibara/config";

export default defineConfig({
  runtimeConfig: {
    test: 123,
    check: "something",
    nested: {
      test: 456,
    },
    fromEnv: {
      nodeEnv: process.env.NODE_ENV,
    },
  },
  presets: {
    dev: {
      runtimeConfig: {
        test: 999,
      },
    },
  },
});
