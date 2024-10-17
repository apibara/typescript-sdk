import { fileURLToPath } from "node:url";
import { resolve } from "pathe";
import { defineBuildConfig } from "unbuild";

const modules = ["cli", "config", "core", "rollup", "types", "hooks "];

// @ts-ignore The 'import.meta' meta-property is only allowed when the '--module' option is 'es2020', 'es2022', 'esnext', 'system', 'node16', or 'nodenext'.
const srcDir = fileURLToPath(new URL("src", import.meta.url));

export default defineBuildConfig({
  entries: [
    { input: "./src/cli/index.ts" },
    { input: "./src/config/index.ts" },
    { input: "./src/core/index.ts" },
    { input: "./src/rollup/index.ts" },
    { input: "./src/types/index.ts" },
    { input: "./src/hooks/index.ts" },
    { input: "./src/internal/consola/index.ts" },
    { input: "./src/internal/citty/index.ts" },
  ],
  clean: true,
  outDir: "./dist",
  declaration: true,
  alias: {
    ...Object.fromEntries(
      modules.map((module) => [
        `apibara/${module}`,
        resolve(srcDir, `${module}/index.ts`),
      ]),
    ),
  },
  externals: [...modules.map((module) => `apibara/${module}`)],
});
