import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "apibara/config";
import type { Plugin } from "apibara/rollup";

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
  rollupConfig: {
    plugins: [typescript() as Plugin],
  },
});
