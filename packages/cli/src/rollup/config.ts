import { existsSync } from "node:fs";
import { builtinModules } from "node:module";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import type { Apibara, RollupConfig } from "apibara/types";
import fsExtra from "fs-extra";
import { basename, join } from "pathe";

export const getRollupConfig = (
  apibara: Apibara,
  dev = false,
): RollupConfig => {
  const extensions: string[] = [
    ".ts",
    ".mjs",
    ".js",
    ".json",
    ".node",
    ".tsx",
    ".jsx",
  ];

  const indexerDir = join(apibara.options.rootDir, "indexers");
  const configPath = join(apibara.options.rootDir, "./apibara.config.ts");

  // Check if the indexers directory and config file exist
  if (!existsSync(indexerDir)) {
    throw new Error(`Indexers directory not found: ${indexerDir}`);
  }
  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  // Check if the indexers directory exists and is not empty
  let indexerFiles: string[] = [];
  try {
    indexerFiles = fsExtra
      .readdirSync(indexerDir)
      .filter((file) => file.endsWith(".indexer.ts"));
    if (indexerFiles.length === 0) {
      console.warn(`No indexer files found in ${indexerDir}`);
    }
  } catch (error) {
    console.error(`Error reading indexers directory: ${error}`);
  }

  const indexerImports = indexerFiles
    .map(
      (file, index) =>
        `import indexer${index} from '${join(indexerDir, file)}';`,
    )
    .join("\n");

  // Generate main.ts content
  const mainContent = `
import { createClient } from "@apibara/protocol";
import { createIndexer, run } from "@apibara/indexer";
import consola from "consola";
import { defineCommand, runMain } from "citty";
import config from './${configPath}';

${indexerImports}

const indexers = {
  ${indexerFiles
    .map(
      (file, index) => `'${basename(file, ".indexer.ts")}': indexer${index},`,
    )
    .join("\n  ")}
};

const command = defineCommand({
  meta: {
    name: "run-indexers",
    description: "Run Apibara indexers",
  },
  args: {
    indexers: {
      type: "string",
      description: "Comma-separated list of indexers to run",
    },
    preset: {
      type: "string",
      description: "Preset to use",
    },
    sink: {
      type: "string",
      description: "Sink to use",
    },
  },
  async run({ args }) {
    const selectedIndexers = args.indexers ? args.indexers.split(',') : Object.keys(indexers);
    const preset = args.preset || config.preset || 'default';
    const sinkName = args.sink || 'default';

    // Apply preset
    let runtimeConfig = { ...config.runtimeConfig };
    if (preset && config.presets && config.presets[preset]) {
      runtimeConfig = { ...runtimeConfig, ...config.presets[preset].runtimeConfig };
    }

    // Get sink function
    const sinkFunction = config.sink?.[sinkName];
    if (!sinkFunction) {
      throw new Error(\`Sink \${sinkName} not found\`);
    }

    await Promise.all(selectedIndexers.map(async (name) => {
      if (!indexers[name]) {
        console.error(\`Indexer \${name} not found\`);
        return;
      }

      const indexerConfig = indexers[name]
      const indexer = typeof indexerConfig === 'function'
        ? await createIndexer(indexerConfig(runtimeConfig))
        : createIndexer(indexerConfig);

      const client = createClient(indexer.streamConfig, indexer.options.streamUrl);
      const sink = sinkFunction();

      try {
        consola.log("Running Indexer: ", name);
        await run(client, indexer, sink);
      } catch (error) {
        consola.error(\`Error in indexer \${name}:\`, error);
      }
    }));
  },
});

runMain(command);
`;

  return {
    input: {
      main: "virtual:main.ts",
    },
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
    plugins: [
      {
        name: "virtual",
        resolveId(id) {
          if (id === "virtual:main.ts") {
            return id;
          }
          return null;
        },
        load(id) {
          if (id === "virtual:main.ts") {
            return mainContent;
          }
          return null;
        },
      },
      nodeResolve({
        extensions,
        preferBuiltins: true,
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: join(apibara.options.rootDir, "./tsconfig.json"),
        compilerOptions: {
          outDir: join(apibara.options.outputDir || "./.apibara/build"),
          declarationDir: join(apibara.options.outputDir || "./.apibara/build"),
          noEmit: false,
          types: ["node"],
        },
      }),
    ],
    onwarn(warning, rollupWarn) {
      if (
        !["CIRCULAR_DEPENDENCY", "EVAL"].includes(warning.code || "") &&
        !warning.message.includes("Unsupported source map comment") &&
        !warning.message.includes("@__PURE__")
      ) {
        rollupWarn(warning);
      }
    },
    treeshake: true,
    external: [
      ...builtinModules,
      "@apibara/indexer",
      "@apibara/protocol",
      "@apibara/evm",
      "@apibara/starknet",
      "@apibara/beaconchain",
      "@apibara/cli",
    ],
  };
};
