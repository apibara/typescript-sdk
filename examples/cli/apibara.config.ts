import { defineConfig } from "apibara/config";

export default defineConfig({
  runtimeConfig: {
    databasePath: ":memory:",
  },
  presets: {
    dev: {
      runtimeConfig: {
        databasePath: "/tmp/my-db.sqlite",
      },
    },
  },
});
