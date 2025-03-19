import { defineConfig } from "apibara/config";

export default defineConfig({
  rolldownConfig: {
    external: [
      "@opentelemetry/exporter-jaeger",
      "@opentelemetry/winston-transport",
    ],
  },
});
