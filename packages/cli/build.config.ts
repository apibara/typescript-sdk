import { fileURLToPath } from "node:url";
import { resolve } from "pathe";
import { defineBuildConfig } from "unbuild";

const modules = [
  "cli",
  "config",
  "core",
  "rolldown",
  "types",
  "hooks",
  "runtime",
  "create",
];

// @ts-ignore
const srcDir = fileURLToPath(new URL("src", import.meta.url));

export default defineBuildConfig({
  entries: [
    { input: "./src/cli/index.ts" },
    { input: "./src/config/index.ts" },
    { input: "./src/core/index.ts" },
    { input: "./src/rolldown/index.ts" },
    { input: "./src/types/index.ts" },
    { input: "./src/hooks/index.ts" },
    { input: "./src/create/index.ts" },
    { input: "./src/runtime/", outDir: "./dist/runtime", format: "esm" },
  ],
  clean: true,
  outDir: "./dist",
  declaration: true,
  alias: {
    "apibara/runtime/meta": resolve(srcDir, "../runtime-meta.mjs"),
    ...Object.fromEntries(
      modules.map((module) => [
        `apibara/${module}`,
        resolve(srcDir, `${module}/index.ts`),
      ]),
    ),
  },
  externals: [
    "apibara/runtime/meta",
    ...modules.map((module) => `apibara/${module}`),
  ],
  rollup: {
    output: {
      banner: ({ fileName }) =>
        fileName === "cli/index.mjs" ? "#!/usr/bin/env node" : undefined,
    },
  },
});
