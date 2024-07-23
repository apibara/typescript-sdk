import { defineConfig } from "./src/config";

export default defineConfig({
  runtimeConfig: {
    test: 123,
  },
  presets: {
    dev: {
      dev: true,
    },
  },
  preset: "dev",
});
