import { defineConfig } from "apibara/config";

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
});
