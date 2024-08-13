import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: [
    "./src/index.ts",
    "./src/sinks/sqlite.ts",
    "./src/sinks/csv.ts",
    "./src/sinks/drizzle.ts",
    "./src/testing/index.ts",
  ],
  clean: true,
  outDir: "./dist",
  declaration: true,
  rollup: {
    emitCJS: true,
  },
});
