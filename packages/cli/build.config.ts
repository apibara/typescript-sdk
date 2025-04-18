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
  "common",
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
    { input: "./src/common/index.ts" },
    { input: "./src/runtime/", outDir: "./dist/runtime", format: "esm" },
    { input: "./src/indexer/", outDir: "./dist/indexer", format: "esm" },
  ],
  sourcemap: true,
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
  hooks: {
    "build:before": () => {
      console.time("build");
    },
    "build:done": () => {
      console.timeEnd("build");
    },
  },
  rollup: {
    output: {
      banner: ({ fileName }: { fileName: string }) =>
        fileName === "cli/index.mjs" ? "#!/usr/bin/env node" : undefined,
    },
  },
});
