import consola from "consola";
import prompts from "prompts";
import { cyan, red, reset } from "./colors";
import {
  type ChainDataType,
  type NetworkDataType,
  type StorageDataType,
  chains,
  storages,
} from "./constants";
import { initializeProject } from "./init";
import {
  createIndexerFile,
  createStorageRelatedFiles,
  updateApibaraConfigFile,
  updatePackageJson,
} from "./templates";
import type { Chain, IndexerOptions, Network, Storage } from "./types";
import {
  cancelOperation,
  convertKebabToCamelCase,
  getApibaraConfigLanguage,
  getPackageManager,
  hasApibaraConfig,
  validateChain,
  validateDnaUrl,
  validateIndexerId,
  validateNetwork,
  validateStorage,
} from "./utils";

type Options = {
  argIndexerId?: string;
  argChain?: string;
  argNetwork?: string;
  argStorage?: string;
  argDnaUrl?: string;
};

export async function addIndexer({
  argIndexerId,
  argChain,
  argNetwork,
  argStorage,
  argDnaUrl,
}: Options) {
  const configExists = hasApibaraConfig(process.cwd());

  if (!configExists) {
    consola.error("No apibara.config found in the current directory.");

    const prompt_initialize = await prompts({
      type: "confirm",
      name: "prompt_initialize",
      message: reset(
        "Do you want to initialize a apibara project here before adding an indexer?",
      ),
    });

    if (prompt_initialize.prompt_initialize) {
      await initializeProject({
        argTargetDir: process.cwd(),
        argNoCreateIndexer: true,
      });
    } else {
      consola.info(
        `Initialize a project with ${cyan("apibara init")} before adding an indexer`,
      );
      throw new Error(
        red("✖") + " Operation cancelled: No apibara.config found",
      );
    }
  }

  const language = getApibaraConfigLanguage(process.cwd());

  validateIndexerId(argIndexerId, true);
  validateChain(argChain, true);
  validateNetwork(argChain, argNetwork, true);
  validateStorage(argStorage, true);
  validateDnaUrl(argDnaUrl, true);

  const result = await prompts(
    [
      {
        type: argIndexerId ? null : "text",
        name: "prompt_indexerId",
        message: reset("Indexer ID:"),
        initial: argIndexerId ?? "my-indexer",
        validate: (id) =>
          validateIndexerId(id) ||
          "Invalid indexer ID cannot be empty and must be in kebab-case format",
      },
      {
        type: argChain ? null : "select",
        name: "prompt_chain",
        message: reset("Select a chain:"),
        choices: chains.map((chain) => ({
          title: chain.color(chain.display),
          value: chain,
        })),
      },
      {
        type: argNetwork ? null : "select",
        name: "prompt_network",
        message: reset("Select a network:"),
        choices: (chain: ChainDataType | undefined) => [
          ...(
            chain?.networks ??
            chains.find((c) => c.name === argChain)?.networks ??
            []
          ).map((network) => ({
            title: network.color(network.display),
            value: network,
          })),
          {
            title: cyan("Other"),
            value: {
              color: cyan,
              display: "Other",
              name: "other",
            } as NetworkDataType,
          },
        ],
      },
      {
        type: (network: NetworkDataType | undefined) => {
          if (network || argNetwork) {
            return network?.name === "other" || argNetwork === "other"
              ? "text"
              : null;
          }
          return null;
        },
        name: "prompt_dnaUrl",
        message: reset("Enter a DNA URL:"),
        validate: (url) => validateDnaUrl(url) || "Provide a valid DNA Url",
      },
      {
        type: argStorage ? null : "select",
        name: "prompt_storage",
        message: reset("Select a storage:"),
        choices: storages.map((storage) => ({
          title: storage.color(storage.display),
          value: storage,
        })),
      },
    ],
    {
      onCancel: () => {
        cancelOperation();
      },
    },
  );

  const {
    prompt_indexerId,
    prompt_chain,
    prompt_network,
    prompt_storage,
    prompt_dnaUrl,
  } = result as {
    prompt_indexerId: string | undefined;
    prompt_chain: ChainDataType | undefined;
    prompt_network: NetworkDataType | undefined;
    prompt_storage: StorageDataType | undefined;
    prompt_dnaUrl: string | undefined;
  };

  if (!argIndexerId && !prompt_indexerId) {
    throw new Error(red("✖") + " Indexer ID is required");
  }

  if (!argChain && !prompt_chain) {
    throw new Error(red("✖") + " Chain is required");
  }

  if (!argNetwork && !prompt_network) {
    throw new Error(red("✖") + " Network is required");
  }

  const indexerFileId = argIndexerId! ?? prompt_indexerId!;

  const pkgManager = getPackageManager();

  const options: IndexerOptions = {
    cwd: process.cwd(),
    indexerFileId,
    indexerId: convertKebabToCamelCase(indexerFileId),
    chain: (argChain as Chain) ?? prompt_chain?.name!,
    network: (argNetwork as Network) ?? prompt_network?.name!,
    storage: (argStorage as Storage) ?? prompt_storage?.name!,
    dnaUrl: argDnaUrl ?? prompt_dnaUrl,
    language,
    packageManager: pkgManager.name,
  };

  updateApibaraConfigFile(options);

  consola.success(
    `Updated ${cyan("apibara.config." + (language === "typescript" ? "ts" : "js"))}`,
  );

  updatePackageJson(options);

  consola.success(`Updated ${cyan("package.json")}`);

  await createIndexerFile(options);

  consola.success(
    `Created ${cyan(`${indexerFileId}.indexer.${language === "typescript" ? "ts" : "js"}`)}`,
  );

  await createStorageRelatedFiles(options);

  console.log();

  consola.info(
    `Before running the indexer, run ${cyan(`${options.packageManager} run install`)}${
      language === "typescript"
        ? " & " + cyan(`${options.packageManager} run prepare`)
        : ""
    }`,
  );
}
