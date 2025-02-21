import fs from "node:fs";
import path from "node:path";
import { consola } from "consola";
import { type ObjectLiteralExpression, Project, SyntaxKind } from "ts-morph";
import { cyan, green, magenta, yellow } from "./colors";
import { packageVersions } from "./constants";
import type { IndexerOptions } from "./types";
import { checkFileExists, getDnaUrl } from "./utils";

export function generatePackageJson(isTypeScript: boolean) {
  return {
    name: "apibara-app",
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      prepare: "apibara prepare",
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
        "@rollup/plugin-typescript":
          packageVersions["@rollup/plugin-typescript"],
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
  return `${isTypeScript ? 'import typescript from "@rollup/plugin-typescript";\nimport type { Plugin } from "apibara/rollup";\n' : ""}import { defineConfig } from "apibara/config";

export default defineConfig({
  runtimeConfig: {},${
    isTypeScript
      ? `
  rollupConfig: {
    plugins: [typescript()${isTypeScript ? " as Plugin" : ""}],
  },`
      : ""
  }
});\n`;
}

export function generateIndexer({
  indexerId,
  storage,
  chain,
  language,
}: IndexerOptions) {
  return `${
    chain === "ethereum"
      ? `import { EvmStream } from "@apibara/evm";`
      : chain === "beaconchain"
        ? `import { BeaconChainStream } from "@apibara/beaconchain";`
        : chain === "starknet"
          ? `import { StarknetStream } from "@apibara/starknet";`
          : ""
  }
import { defineIndexer } from "@apibara/indexer";
${storage === "postgres" ? `import { drizzleStorage } from "@apibara/plugin-drizzle";` : ""}
${language === "typescript" ? `import type { ApibaraRuntimeConfig } from "apibara/types";` : ""}
import { useLogger } from "@apibara/indexer/plugins";
${
  storage === "postgres"
    ? `import { getDrizzlePgDatabase } from "../lib/db";`
    : ""
}


export default function (runtimeConfig${language === "typescript" ? ": ApibaraRuntimeConfig" : ""}) {
  const indexerId = "${indexerId}";
  const { startingBlock, streamUrl${storage === "postgres" ? ", postgresConnectionString" : ""} } = runtimeConfig[indexerId];
  ${
    storage === "postgres"
      ? "const { db } = getDrizzlePgDatabase(postgresConnectionString);"
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
    plugins: [${storage === "postgres" ? "drizzleStorage({ db, persistState: true })" : ""}],
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
      //   const { db } = useDrizzleStorage();
      //   const { logs } = block;
      //   for (const log of logs) {
      //     await db.insert(exampleTable).values({
      //       number: Number(endCursor?.orderKey),
      //       hash: log.transactionHash,
      //     });
      //   }`
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
}

export function updatePackageJson({
  cwd,
  chain,
  storage,
  language,
}: IndexerOptions) {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(cwd, "package.json"), "utf8"),
  );

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

  fs.writeFileSync(
    path.join(cwd, "package.json"),
    JSON.stringify(packageJson, null, 2),
  );
}

export function updateApibaraConfigFile({
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
  streamUrl: "${dnaUrl ?? getDnaUrl(chain, network)}"${
    storage === "postgres"
      ? `,
  postgresConnectionString: process.env["POSTGRES_CONNECTION_STRING"] ?? "memory://${indexerId}"`
      : ""
  }}`;

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

  sourceFile.formatText({
    tabSize: 2,
    insertSpaceAfterOpeningAndBeforeClosingEmptyBraces: true,
    insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,
  });
}

export async function createDrizzleStorageFiles(options: IndexerOptions) {
  const { cwd, language, storage } = options;

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
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env["POSTGRES_CONNECTION_STRING"] ?? "",
  },
}${language === "typescript" ? " satisfies Config" : ""};`;

    fs.writeFileSync(drizzleConfigPath, drizzleConfigContent);

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

// export const exampleTable = pgTable("example_table", {
//   id: uuid("id").primaryKey().defaultRandom(),
//   number: bigint("number", { mode: "number" }),
//   hash: text("hash"),
// });

export {};
  `;

    // create directory if it doesn't exist
    fs.mkdirSync(path.dirname(schemaPath), { recursive: true });
    fs.writeFileSync(schemaPath, schemaContent);

    consola.success(`Created ${cyan("lib/schema.ts")}`);
  }

  /**
   *
   *
   * DB File
   *
   *
   */
  const dbFileName = `db.${fileExtension}`;

  const dbPath = path.join(cwd, "lib", dbFileName);

  const { exists: dbExists, overwrite: dbOverwrite } = await checkFileExists(
    dbPath,
    {
      askPrompt: true,
      fileName: `lib/${dbFileName}`,
      allowIgnore: true,
    },
  );

  if (!dbExists || dbOverwrite) {
    const dbContent = `import * as schema from "./schema";
import { drizzle as nodePgDrizzle } from "drizzle-orm/node-postgres";
import { drizzle as pgLiteDrizzle } from "drizzle-orm/pglite";
import pg from "pg";


export function getDrizzlePgDatabase(connectionString${language === "typescript" ? ": string" : ""}) {
  // Create pglite instance
  if (connectionString.includes("memory")) {
    return {
      db: pgLiteDrizzle({
        schema,
        connection: {
          dataDir: connectionString,
        },
      }),
    };
  }

  // Create node-postgres instance
  const pool = new pg.Pool({
    connectionString,
  });

  return { db: nodePgDrizzle(pool, { schema }) };
}`;

    // create directory if it doesn't exist
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, dbContent);

    consola.success(`Created ${cyan(`lib/${dbFileName}`)}`);
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

export const exampleTable = pgTable("example_table", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: bigint("number", { mode: "number" }),
  hash: text("hash"),
});`)}`);

    console.log("\n");
  }

  consola.info(
    `Run ${green(`${options.packageManager} run drizzle:generate`)} & ${green(`${options.packageManager} run drizzle:migrate`)} to generate and apply migrations.`,
  );
}

export async function createStorageRelatedFiles(options: IndexerOptions) {
  const { storage } = options;

  if (storage === "postgres") {
    await createDrizzleStorageFiles(options);
  }
}
