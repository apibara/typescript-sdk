import { builtinModules } from "node:module";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import type { Apibara, RollupConfig } from "apibara/types";
import { join } from "pathe";
import type { OutputPluginOption } from "rollup";
import esbuild from "rollup-plugin-esbuild";

import { appConfig } from "./plugins/config";
import { indexers } from "./plugins/indexers";

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

  const rollupConfig: RollupConfig & { plugins: OutputPluginOption[] } = {
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
        !warning.message.includes("@__PURE__")
      ) {
        rollupWarn(warning);
      }
    },
    treeshake: true,
    external: [...builtinModules],
  };

  rollupConfig.plugins.push(commonjs());
  rollupConfig.plugins.push(json());

  rollupConfig.plugins.push(
    nodeResolve({
      extensions,
      preferBuiltins: true,
      mainFields: ["main"],
    }),
  );

  rollupConfig.plugins.push(
    esbuild({
      target: "es2022",
      sourceMap: apibara.options.sourceMap,
    }),
  );

  rollupConfig.plugins.push(indexers(apibara));
  rollupConfig.plugins.push(appConfig(apibara));

  return rollupConfig;
}
