import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "apibara/config";
import type { Plugin } from "apibara/rollup";

export default defineConfig({
  runtimeConfig: {
    connectionString: process.env["POSTGRES_CONNECTION_STRING"] ?? "memory://",
  },
  presets: {
    dev: {
      runtimeConfig: {
        connectionString: "memory://",
      },
    },
  },
  rollupConfig: {
    plugins: [typescript() as Plugin],
  },
});
