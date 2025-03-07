import { existsSync } from "node:fs";
import { builtinModules } from "node:module";
import type { Apibara } from "apibara/types";
import defu from "defu";
import { join } from "pathe";
import type {
  ConfigExport,
  RolldownOptions,
  RolldownPluginOption,
} from "rolldown";
import { appConfig } from "./plugins/config";
import { indexers } from "./plugins/indexers";

const runtimeDependencies = [
  "better-sqlite3",
  "@electric-sql/pglite",
  "pg",
  "ws",
  "node-fetch",
];

export function getRolldownConfig(apibara: Apibara): RolldownOptions {
  const extensions: string[] = [
    ".ts",
    ".mjs",
    ".js",
    ".json",
    ".node",
    ".tsx",
    ".jsx",
  ];

  const tsConfigExists = existsSync(
    join(apibara.options.rootDir, "tsconfig.json"),
  );

  const rolldownConfig: RolldownOptions & {
    plugins: RolldownPluginOption[];
  } = defu(
    // biome-ignore lint/suspicious/noExplicitAny: apibara.options.rolldownConfig is typed
    apibara.options.rolldownConfig as any,
    <ConfigExport>{
      platform: "node",
      input: apibara.options.entry,
      output: {
        dir: join(apibara.options.outputDir || "./.apibara/build"),
        format: "esm",
        entryFileNames: "[name].mjs",
        chunkFileNames: "chunks/[name]-[hash].mjs",
        sourcemap: true,
      },
      plugins: [],
      onwarn(warning, rolldownWarn) {
        if (
          !["CIRCULAR_DEPENDENCY", "EVAL", "THIS_IS_UNDEFINED"].includes(
            warning.code || "",
          ) &&
          !warning.message.includes("Unsupported source map comment") &&
          !warning.message.includes("@__PURE__") &&
          !warning.message.includes("/*#__PURE__*/")
        ) {
          rolldownWarn(warning);
        }
      },
      resolve: {
        extensions,
        preferBuiltins: !!apibara.options.node,
        mainFields: ["main"],
        exportConditions: apibara.options.exportConditions,
        tsconfigFilename: tsConfigExists ? "tsconfig.json" : undefined,
      },
      treeshake: true,
      external: [...builtinModules, ...runtimeDependencies],
    },
  );

  rolldownConfig.plugins?.push(indexers(apibara));
  rolldownConfig.plugins?.push(appConfig(apibara));

  return rolldownConfig;
}
