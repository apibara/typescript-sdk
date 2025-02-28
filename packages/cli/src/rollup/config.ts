import { builtinModules } from "node:module";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import type { Apibara, RollupConfig } from "apibara/types";
import { join } from "pathe";
import type { OutputPluginOption } from "rollup";

import defu from "defu";
import { appConfig } from "./plugins/config";
import { esmShim } from "./plugins/esm-shim";
import { indexers } from "./plugins/indexers";

const runtimeDependencies = ["better-sqlite3", "@electric-sql/pglite"];

export function getRollupConfig(apibara: Apibara): RollupConfig {
  const extensions: string[] = [
    ".ts",
    ".mjs",
    ".js",
    ".json",
    ".node",
    ".tsx",
    ".jsx",
  ];

  const rollupConfig: RollupConfig & { plugins: OutputPluginOption[] } = defu(
    // biome-ignore lint/suspicious/noExplicitAny: apibara.options.rollupConfig is typed
    apibara.options.rollupConfig as any,
    <RollupConfig>{
      input: apibara.options.entry,
      output: {
        dir: join(apibara.options.outputDir || "./.apibara/build"),
        format: "esm",
        exports: "auto",
        entryFileNames: "[name].mjs",
        chunkFileNames: "chunks/[name]-[hash].mjs",
        generatedCode: {
          constBindings: true,
        },
        sourcemap: true,
        sourcemapExcludeSources: true,
        sourcemapIgnoreList(relativePath, sourcemapPath) {
          return relativePath.includes("node_modules");
        },
      },
      plugins: [],
      onwarn(warning, rollupWarn) {
        if (
          !["CIRCULAR_DEPENDENCY", "EVAL", "THIS_IS_UNDEFINED"].includes(
            warning.code || "",
          ) &&
          !warning.message.includes("Unsupported source map comment") &&
          !warning.message.includes("@__PURE__") &&
          !warning.message.includes("/*#__PURE__*/")
        ) {
          rollupWarn(warning);
        }
      },
      treeshake: true,
      external: [...builtinModules, ...runtimeDependencies],
    },
  );

  rollupConfig.plugins.push(esmShim());
  rollupConfig.plugins.push(json());

  rollupConfig.plugins.push(
    commonjs({
      strictRequires: true,
      requireReturnsDefault: "auto",
      ...apibara.options.commonJS,
    }),
  );

  rollupConfig.plugins.push(
    nodeResolve({
      extensions,
      preferBuiltins: !!apibara.options.node,
      mainFields: ["main"],
      exportConditions: apibara.options.exportConditions,
    }),
  );

  rollupConfig.plugins.push(indexers(apibara));
  rollupConfig.plugins.push(appConfig(apibara));

  return rollupConfig;
}
