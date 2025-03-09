import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: [
    "./src/index.ts",
    "./src/testing/index.ts",
    "./src/vcr/index.ts",
    "./src/plugins/index.ts",
    "./src/internal/testing.ts",
    "./src/internal/plugins.ts",
    "./src/internal/index.ts",
  ],
  clean: true,
  outDir: "./dist",
  declaration: true,
  rollup: {
    emitCJS: true,
  },
  externals: ["drizzle-orm"],
});
