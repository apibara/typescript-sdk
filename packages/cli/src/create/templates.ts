import fs from "node:fs";
import path from "node:path";
import { consola } from "consola";
import prompts from "prompts";
import { type ObjectLiteralExpression, Project, SyntaxKind } from "ts-morph";
import { cyan, green, magenta, yellow } from "./colors";
import { packageVersions } from "./constants";
import type { IndexerOptions } from "./types";
import { checkFileExists, formatFile, getDnaUrl } from "./utils";

export function generatePackageJson(isTypeScript: boolean) {
  return {
    name: "apibara-app",
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      ...(isTypeScript && { prepare: "apibara prepare" }),
      dev: "apibara dev",
      start: "apibara start",
      build: "apibara build",
      ...(isTypeScript && { typecheck: "tsc --noEmit" }),
    },
    dependencies: {
      "@apibara/indexer": packageVersions["@apibara/indexer"],
      "@apibara/protocol": packageVersions["@apibara/protocol"],
      apibara: packageVersions.apibara,
    },
    devDependencies: {
      ...(isTypeScript && {
        "@types/node": packageVersions["@types/node"],
        typescript: packageVersions.typescript,
      }),
    },
  };
}

export function generateTsConfig() {
  return {
    $schema: "https://json.schemastore.org/tsconfig",
    display: "Default",
    compilerOptions: {
      forceConsistentCasingInFileNames: true,
      target: "ES2022",
      lib: ["ESNext"],
      module: "ESNext",
      moduleResolution: "bundler",
      skipLibCheck: true,
      types: ["node"],
      noEmit: true,
      strict: true,
      baseUrl: ".",
    },
    include: [".", "./.apibara/types"],
    exclude: ["node_modules"],
  };
}

export function generateApibaraConfig(isTypeScript: boolean) {
  return `import { defineConfig } from "apibara/config";

export default defineConfig({
  runtimeConfig: {},
});\n`;
}

export function generateIndexer({
  indexerId,
  storage,
  chain,
  language,
}: IndexerOptions) {
  return `import { defineIndexer } from "@apibara/indexer";
import { useLogger } from "@apibara/indexer/plugins";
${storage === "postgres" ? `import { drizzleStorage } from "@apibara/plugin-drizzle";` : ""}
${storage === "postgres" ? `import { drizzle } from "@apibara/plugin-drizzle";` : ""}
${
  chain === "ethereum"
    ? `import { EvmStream } from "@apibara/evm";`
    : chain === "beaconchain"
      ? `import { BeaconChainStream } from "@apibara/beaconchain";`
      : chain === "starknet"
        ? `import { StarknetStream } from "@apibara/starknet";`
        : ""
}
${language === "typescript" ? `import type { ApibaraRuntimeConfig } from "apibara/types";` : ""}
${storage === "postgres" ? `import * as schema from "../lib/schema";` : ""}


export default function (runtimeConfig${language === "typescript" ? ": ApibaraRuntimeConfig" : ""}) {
  const indexerId = "${indexerId}";
  const { startingBlock, streamUrl } = runtimeConfig[indexerId];
  ${
    storage === "postgres"
      ? `const db = drizzle({
    schema,
  });`
      : ""
  }

  return defineIndexer(${
    chain === "ethereum"
      ? "EvmStream"
      : chain === "beaconchain"
        ? "BeaconChainStream"
        : chain === "starknet"
          ? "StarknetStream"
          : ""
  })({
    streamUrl,
    finality: "accepted",
    startingBlock: BigInt(startingBlock),
    filter: {
      header: "always",
    },
    plugins: [${storage === "postgres" ? "drizzleStorage({ db, migrate: { migrationsFolder: './drizzle' } })" : ""}],
    async transform({ endCursor, finality }) {
      const logger = useLogger();

      logger.info(
        "Transforming block | orderKey: ",
        endCursor?.orderKey,
        " | finality: ",
        finality
      );

      ${
        storage === "postgres"
          ? `// Example snippet to insert data into db using drizzle with postgres
      // const { db: database } = useDrizzleStorage();

      // await database.insert(schema.cursorTable).values({
      //   endCursor: Number(endCursor?.orderKey),
      //   uniqueKey: \`\${endCursor?.uniqueKey}\`,
      // });`
          : ""
      }
    },
  });
}   
`;
}

export async function createIndexerFile(options: IndexerOptions) {
  const indexerFilePath = path.join(
    options.cwd,
    "indexers",
    `${options.indexerFileId}.indexer.${options.language === "typescript" ? "ts" : "js"}`,
  );

  const { exists, overwrite } = await checkFileExists(indexerFilePath, {
    askPrompt: true,
  });

  if (exists && !overwrite) return;

  const indexerContent = generateIndexer(options);

  fs.mkdirSync(path.dirname(indexerFilePath), { recursive: true });
  fs.writeFileSync(indexerFilePath, indexerContent);

  await formatFile(indexerFilePath);
}

export async function updatePackageJson({
  cwd,
  chain,
  storage,
  language,
}: IndexerOptions) {
  const packageJsonPath = path.join(cwd, "package.json");

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  if (chain === "ethereum") {
    packageJson.dependencies["@apibara/evm"] = packageVersions["@apibara/evm"];
  } else if (chain === "beaconchain") {
    packageJson.dependencies["@apibara/beaconchain"] =
      packageVersions["@apibara/beaconchain"];
  } else if (chain === "starknet") {
    packageJson.dependencies["@apibara/starknet"] =
      packageVersions["@apibara/starknet"];
  }

  if (storage === "postgres") {
    packageJson.scripts["drizzle:generate"] = "drizzle-kit generate";
    packageJson.scripts["drizzle:migrate"] = "drizzle-kit migrate";

    packageJson.dependencies["@apibara/plugin-drizzle"] =
      packageVersions["@apibara/plugin-drizzle"];

    packageJson.dependencies["drizzle-orm"] = packageVersions["drizzle-orm"];

    packageJson.dependencies["@electric-sql/pglite"] =
      packageVersions["@electric-sql/pglite"];

    packageJson.dependencies["drizzle-kit"] = packageVersions["drizzle-kit"];

    packageJson.dependencies["pg"] = packageVersions["pg"];

    if (language === "typescript") {
      packageJson.devDependencies["@types/pg"] = packageVersions["@types/pg"];
    }
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  await formatFile(packageJsonPath);
}

export async function updateApibaraConfigFile({
  indexerId,
  cwd,
  chain,
  storage,
  language,
  network,
  dnaUrl,
}: IndexerOptions) {
  const pathToConfig = path.join(
    cwd,
    `apibara.config.${language === "typescript" ? "ts" : "js"}`,
  );

  const runtimeConfigString = `{
  startingBlock: 0,
  streamUrl: "${dnaUrl ?? getDnaUrl(chain, network)}"  
}`;

  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(pathToConfig);

  // Find the defineConfig call expression
  const defineConfigCall = sourceFile.getFirstDescendantByKind(
    SyntaxKind.CallExpression,
  );
  if (!defineConfigCall) return;

  const configObjectExpression =
    defineConfigCall.getArguments()[0] as ObjectLiteralExpression;

  const runtimeConfigObject =
    configObjectExpression.getProperty("runtimeConfig");

  if (!runtimeConfigObject) {
    configObjectExpression.addPropertyAssignment({
      name: "runtimeConfig",
      initializer: `{
  "${indexerId}": ${runtimeConfigString}
}`,
    });
  } else {
    const runtimeConfigProp = runtimeConfigObject.asKindOrThrow(
      SyntaxKind.PropertyAssignment,
    );
    const runtimeConfigObj = runtimeConfigProp
      .getInitializerOrThrow()
      .asKindOrThrow(SyntaxKind.ObjectLiteralExpression);

    runtimeConfigObj.addPropertyAssignment({
      name: `"${indexerId}"`,
      initializer: runtimeConfigString,
    });
  }
  // Save the changes
  sourceFile.saveSync();

  await formatFile(pathToConfig);
}

export async function createDrizzleStorageFiles(options: IndexerOptions) {
  const { cwd, language, storage, indexerId } = options;

  if (storage !== "postgres") return;

  const fileExtension = language === "typescript" ? "ts" : "js";

  /**
   *
   *
   * Drizzle Config File
   *
   *
   */

  const drizzleConfigFileName = `drizzle.config.${fileExtension}`;

  // create drizzle.config.ts
  const drizzleConfigPath = path.join(cwd, drizzleConfigFileName);

  const { exists, overwrite } = await checkFileExists(drizzleConfigPath, {
    askPrompt: true,
    allowIgnore: true,
  });

  if (!exists || overwrite) {
    const drizzleConfigContent = `${language === "typescript" ? 'import type { Config } from "drizzle-kit";' : ""}

export default {
  schema: "./lib/schema.${fileExtension}",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env["POSTGRES_CONNECTION_STRING"] ?? "memory://${indexerId}",
  },
}${language === "typescript" ? " satisfies Config" : ""};`;

    fs.writeFileSync(drizzleConfigPath, drizzleConfigContent);

    await formatFile(drizzleConfigPath);

    consola.success(`Created ${cyan(drizzleConfigFileName)}`);
  }

  /**
   *
   *
   * Schema File
   *
   *
   */

  const schemaFileName = `schema.${fileExtension}`;

  const schemaPath = path.join(cwd, "lib", schemaFileName);

  const { exists: schemaExists, overwrite: schemaOverwrite } =
    await checkFileExists(schemaPath, {
      askPrompt: true,
      allowIgnore: true,
      fileName: `lib/${schemaFileName}`,
    });

  if (!schemaExists || schemaOverwrite) {
    const schemaContent = `//  --- Add your pg table schemas here ----

// import { bigint, pgTable, text, uuid } from "drizzle-orm/pg-core";

// export const cursorTable = pgTable("cursor_table", {
//   id: uuid("id").primaryKey().defaultRandom(),
//   endCursor: bigint("end_cursor", { mode: "number" }),
//   uniqueKey: text("unique_key"),
// });

export {};
  `;

    // create directory if it doesn't exist
    fs.mkdirSync(path.dirname(schemaPath), { recursive: true });
    fs.writeFileSync(schemaPath, schemaContent);

    await formatFile(schemaPath);

    consola.success(`Created ${cyan("lib/schema.ts")}`);
  }

  console.log("\n");

  // If schema file is created, show the example
  if (!schemaExists || schemaOverwrite) {
    consola.info(
      `Make sure to export your pgTables in ${cyan(`lib/${schemaFileName}`)}`,
    );

    console.log();

    consola.info(`${magenta("Example:")}
    
${yellow(`
┌──────────────────────────────────────────┐
│               lib/schema.ts              │
└──────────────────────────────────────────┘

import { bigint, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const cursorTable = pgTable("cursor_table", {
  id: uuid("id").primaryKey().defaultRandom(),
  endCursor: bigint("end_cursor", { mode: "number" }),
  uniqueKey: text("unique_key"),
});`)}`);

    console.log("\n");
  }

  consola.info(
    `Run ${green(`${options.packageManager}${options.packageManager === "npm" ? " run" : ""} drizzle:generate`)} & ${green(`${options.packageManager}${options.packageManager === "npm" ? " run" : ""} drizzle:migrate`)} to generate and apply migrations.`,
  );
}

export async function createStorageRelatedFiles(options: IndexerOptions) {
  const { storage } = options;

  if (storage === "postgres") {
    await createDrizzleStorageFiles(options);
  }
}

const gitIgnoreItems: {
  isRecommended: boolean;
  description?: string;
  value: string;
}[] = [
  {
    isRecommended: false,
    value: "node_modules",
  },
  {
    isRecommended: false,
    value: "dist",
  },
  {
    isRecommended: true,
    description: "build and dev files of apibara",
    value: ".apibara",
  },
  {
    isRecommended: false,
    value: ".env",
  },
  {
    isRecommended: false,
    description: "for mac users",
    value: ".DS_Store",
  },
];

export async function createGitIgnoreFile(cwd: string) {
  const gitIgnorePath = path.join(cwd, ".gitignore");

  if (fs.existsSync(gitIgnorePath)) {
    const result = await prompts([
      {
        type: "select",
        name: "overwrite",
        message: `${cyan(".gitignore")} already exists. Please choose how to proceed:`,
        initial: 0,
        choices: [
          {
            title: "Choose items to append in your .gitignore",
            value: "append",
          },
          {
            title: "Keep original",
            value: "ignore",
          },
          {
            title: "Overwrite",
            value: "overwrite",
          },
        ],
      },
      {
        type: (overwrite: "append" | "ignore" | "overwrite") =>
          overwrite === "append" ? "multiselect" : null,
        name: "ignoreItems",
        message: "Choose items to append in your .gitignore",
        choices: gitIgnoreItems.map((item) => ({
          title: `${yellow(item.value)}${
            item.description ? ` - ${item.description}` : ""
          }${item.isRecommended ? ` ${green("(recommended)")}` : ""}`,
          value: item.value,
        })),
      },
    ]);

    const { overwrite, ignoreItems } = result as {
      overwrite: "append" | "ignore" | "overwrite";
      ignoreItems: string[];
    };

    if (overwrite === "append" && ignoreItems.length > 0) {
      const gitIgnoreContent = fs.readFileSync(gitIgnorePath, "utf8");
      fs.writeFileSync(
        gitIgnorePath,
        `${gitIgnoreContent}\n${result.ignoreItems.join("\n")}`,
      );
      consola.success(`Updated ${cyan(".gitignore")}`);
      return;
    }

    if (overwrite === "overwrite") {
      fs.writeFileSync(
        gitIgnorePath,
        gitIgnoreItems.map((item) => item.value).join("\n"),
      );
      consola.success(`Updated ${cyan(".gitignore")}`);
      return;
    }
  }

  fs.writeFileSync(
    gitIgnorePath,
    gitIgnoreItems.map((item) => item.value).join("\n"),
  );
  consola.success(`Created ${cyan(".gitignore")}`);
}
