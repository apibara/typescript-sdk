import { defineBuildConfig } from "unbuild";
import { fileURLToPath } from "node:url";
import { resolve } from "pathe";

const modules = [
  "cli",
  "config",
  "core",
  "rollup",
  "types",
];

const srcDir = fileURLToPath(new URL("src", import.meta.url));

export default defineBuildConfig({
  entries: [
    { input: "./src/cli/index.ts" },
    { input: "./src/config/index.ts" },
    { input: "./src/core/index.ts" },
    { input: "./src/rollup/index.ts" },
  ],
  clean: true,
  outDir: "./dist",
  declaration: true,
  alias: {
    ...Object.fromEntries(
      modules.map((module) => [
        `apibara/${module}`,
        resolve(srcDir, `${module}/index.ts`),
      ])
    ),
  },
  externals: [
    ...modules.map((module) => `apibara/${module}`),
  ],
});

