import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["./src/index.ts", "./src/helper.ts"],
  clean: true,
  outDir: "./dist",
  declaration: true,
  rollup: {
    emitCJS: true,
  },
  externals: ["@electric-sql/pglite"],
});
