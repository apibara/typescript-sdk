import fs from "node:fs";
import path from "node:path";
import consola from "consola";
import prompts from "prompts";
import { addIndexer } from "./add";
import { cyan, green } from "./colors";
import {
  createGitIgnoreFile,
  generateApibaraConfig,
  generatePackageJson,
  generateTsConfig,
} from "./templates";
import type { Language } from "./types";
import {
  cancelOperation,
  emptyDir,
  formatFile,
  getLanguageFromAlias,
  getPackageManager,
  isEmpty,
  validateLanguage,
} from "./utils";

type Options = {
  argTargetDir: string;
  argLanguage?: string;
  argNoCreateIndexer?: boolean;
};

export async function initializeProject({
  argTargetDir,
  argLanguage,
  argNoCreateIndexer,
}: Options) {
  const cwd = process.cwd();
  validateLanguage(argLanguage, true);

  console.log();

  const result = await prompts(
    [
      {
        type: () =>
          argTargetDir &&
          (!fs.existsSync(argTargetDir) || isEmpty(argTargetDir))
            ? null
            : "select",
        name: "overwrite",
        message: () =>
          (argTargetDir === "."
            ? "Current directory"
            : `Target directory "${argTargetDir}"`) +
          " is not empty. Please choose how to proceed:",
        initial: 0,
        choices: [
          {
            title: "Cancel operation",
            value: "no",
          },
          {
            title: "Remove existing files and continue",
            value: "yes",
          },
          {
            title: "Ignore files and continue",
            value: "ignore",
          },
        ],
        hint: "\nCurrent Working Directory: " + cwd,
      },
      {
        type: (_, { overwrite }: { overwrite?: string }) => {
          if (overwrite === "no") {
            cancelOperation();
          }
          return null;
        },
        name: "overwriteChecker",
      },
      {
        type: argLanguage ? null : "select",
        name: "prompt_language",
        message: "Select a language:",
        choices: [
          {
            title: "Typescript",
            value: "typescript",
          },
          {
            title: "Javascript",
            value: "javascript",
          },
        ],
      },
    ],
    {
      onCancel: () => {
        cancelOperation();
      },
    },
  );

  const { overwrite, prompt_language } = result as {
    overwrite: "no" | "yes" | "ignore";
    prompt_language: "typescript" | "javascript";
  };

  const root = path.join(cwd, argTargetDir);
  if (overwrite === "yes") {
    emptyDir(root);
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }

  const lang: Language = argLanguage
    ? getLanguageFromAlias(argLanguage)
    : prompt_language;

  const isTs = lang === "typescript";
  const configExt = isTs ? "ts" : "js";

  console.log("\n");
  consola.info(`Initializing project in ${argTargetDir}\n\n`);

  // Generate package.json
  const packageJsonPath = path.join(root, "package.json");
  const packageJson = generatePackageJson(isTs);
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n",
  );
  await formatFile(packageJsonPath);
  consola.success("Created", cyan("package.json"));

  // Generate tsconfig.json if TypeScript
  if (isTs) {
    const tsConfigPath = path.join(root, "tsconfig.json");
    const tsConfig = generateTsConfig();
    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2) + "\n");
    await formatFile(tsConfigPath);
    consola.success("Created", cyan("tsconfig.json"));
  }

  const apibaraConfigPath = path.join(root, `apibara.config.${configExt}`);
  // Generate apibara.config
  const apibaraConfig = generateApibaraConfig(isTs);
  fs.writeFileSync(apibaraConfigPath, apibaraConfig);
  await formatFile(apibaraConfigPath);
  consola.success("Created", cyan(`apibara.config.${configExt}`));

  // Create "indexers" directory if not exists
  const indexersDir = path.join(root, "indexers");
  if (!fs.existsSync(indexersDir)) {
    fs.mkdirSync(indexersDir, { recursive: true });
    consola.success(`Created ${cyan("indexers")} directory`);
  }

  await createGitIgnoreFile(root);

  console.log("\n");

  consola.ready(green("Project initialized successfully"));

  console.log();

  if (!argNoCreateIndexer) {
    consola.info("Let's create an indexer\n");

    await addIndexer({ argRootDir: argTargetDir });
  } else {
    const pkgManager = getPackageManager();
    consola.info(
      "Run ",
      green(`${pkgManager.name} install`),
      " to install all dependencies",
    );
  }
}
