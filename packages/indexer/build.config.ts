import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: [
    "./src/index.ts",
    "./src/sinks/sqlite.ts",
    "./src/sinks/csv.ts",
    "./src/sinks/drizzle/index.ts",
    "./src/testing/index.ts",
    "./src/vcr/index.ts",
    "./src/plugins/index.ts",
    "./src/plugins/kv.ts",
    "./src/plugins/logger.ts",
    "./src/plugins/persistence.ts",
  ],
  clean: true,
  outDir: "./dist",
  declaration: true,
  rollup: {
    emitCJS: true,
  },
});
