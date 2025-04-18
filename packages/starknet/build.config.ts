import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["./src/index.ts", "./src/parser.ts"],
  clean: true,
  outDir: "./dist",
  declaration: true,
  sourcemap: true,
  rollup: {
    emitCJS: true,
  },
});
