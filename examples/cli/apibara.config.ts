import { defineConfig } from "apibara/config";

export default defineConfig({
  runtimeConfig: {
    pgLiteDBPath: "memory://persistence",
  },
  presets: {
    dev: {
      runtimeConfig: {
        pgLiteDBPath: "./.persistence",
      },
    },
  },
  // rollupConfig: {
  //   plugins: [tsConfigPaths()],
  // },
});
