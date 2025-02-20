import fs from "node:fs";
import path, { basename } from "node:path";
import prompts from "prompts";
import { blue, cyan, red, yellow } from "./colors";
import { dnaUrls, networks } from "./constants";
import type { Chain, Language, Network } from "./types";

export function isEmpty(path: string) {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === ".git");
}
export function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === ".git") {
      continue;
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
  }
}

export function validateLanguage(language?: string, throwError = false) {
  if (!language) {
    return false;
  }

  if (
    language === "typescript" ||
    language === "ts" ||
    language === "javascript" ||
    language === "js"
  ) {
    return true;
  }

  if (throwError) {
    throw new Error(
      `Invalid language ${cyan("(--language | -l)")}: ${red(language)}. Options: ${blue("typescript, ts")} or ${yellow("javascript, js")} | default: ${cyan("typescript")}`,
    );
  }

  return false;
}

export function getLanguageFromAlias(alias: string): Language {
  if (alias === "ts" || alias === "typescript") {
    return "typescript";
  }
  if (alias === "js" || alias === "javascript") {
    return "javascript";
  }

  throw new Error(
    `Invalid language ${cyan("(--language | -l)")}: ${red(alias)}. Options: ${blue("typescript, ts")} or ${yellow("javascript, js")}`,
  );
}

export function validateIndexerId(indexerId?: string, throwError = false) {
  if (!indexerId) {
    return false;
  }
  if (!/^[a-z0-9-]+$/.test(indexerId)) {
    if (throwError) {
      throw new Error(
        `Invalid indexer ID ${cyan("(--indexer-id)")}: ${red(indexerId)}. Indexer ID must contain only lowercase letters, numbers, and hyphens.`,
      );
    }
    return false;
  }
  return true;
}

export function validateChain(chain?: string, throwError = false) {
  if (!chain) {
    return false;
  }
  if (chain) {
    if (chain === "starknet" || chain === "ethereum" || chain === "beaconchain")
      return true;
    if (throwError) {
      throw new Error(
        `Invalid chain ${cyan("(--chain)")}: ${red(chain)}. Chain must be one of ${blue("starknet, ethereum, beaconchain")}.`,
      );
    }
    return false;
  }
  return true;
}

export function validateNetwork(
  chain?: string,
  network?: string,
  throwError = false,
) {
  if (!network) {
    return false;
  }

  if (network === "other") {
    return true;
  }

  if (chain) {
    if (chain === "starknet") {
      if (network === "mainnet" || network === "sepolia") {
        return true;
      }
      if (throwError) {
        throw new Error(
          `Invalid network ${cyan("(--network)")}: ${red(network)}. For chain ${blue("starknet")}, network must be one of ${blue("mainnet, sepolia, other")}.`,
        );
      }
      return false;
    }
    if (chain === "ethereum") {
      if (network === "mainnet" || network === "goerli") {
        return true;
      }
      if (throwError) {
        throw new Error(
          `Invalid network ${cyan("(--network)")}: ${red(network)}. For chain ${blue("ethereum")}, network must be one of ${blue("mainnet, goerli, other")}.`,
        );
      }
      return false;
    }
    if (chain === "beaconchain") {
      if (network === "mainnet") {
        return true;
      }
      if (throwError) {
        throw new Error(
          `Invalid network ${cyan("(--network)")}: ${red(network)}. For chain ${blue("beaconchain")}, network must be ${blue("mainnet, other")}.`,
        );
      }
      return false;
    }
  }

  if (networks.find((n) => n.name === network)) {
    return true;
  }

  if (throwError) {
    throw new Error(
      `Invalid network ${cyan("(--network)")}: ${red(network)}. Network must be one of ${blue("mainnet, sepolia, goerli, other")}.`,
    );
  }
  return false;
}

export function validateStorage(storage?: string, throwError = false) {
  if (!storage) {
    return false;
  }
  if (storage === "postgres" || storage === "none") {
    return true;
  }
  if (throwError) {
    throw new Error(
      `Invalid storage ${cyan("(--storage)")}: ${red(storage)}. Storage must be one of ${blue("postgres, none")}.`,
    );
  }
  return false;
}

export function validateDnaUrl(dnaUrl?: string, throwError = false) {
  if (!dnaUrl) {
    return false;
  }
  if (!dnaUrl.startsWith("https://") && !dnaUrl.startsWith("http://")) {
    if (throwError) {
      throw new Error(
        `Invalid DNA URL ${cyan("(--dna-url)")}: ${red(dnaUrl)}. DNA URL must start with ${blue("https:// or http://")}.`,
      );
    }
    return false;
  }
  return true;
}

export function hasApibaraConfig(cwd: string): boolean {
  const configPathJS = path.join(cwd, "apibara.config.js");
  const configPathTS = path.join(cwd, "apibara.config.ts");

  return fs.existsSync(configPathJS) || fs.existsSync(configPathTS);
}

export function getApibaraConfigLanguage(cwd: string): Language {
  const configPathJS = path.join(cwd, "apibara.config.js");
  const configPathTS = path.join(cwd, "apibara.config.ts");

  if (fs.existsSync(configPathJS)) {
    return "javascript";
  }
  if (fs.existsSync(configPathTS)) {
    return "typescript";
  }

  throw new Error(red("✖") + " No apibara.config found");
}

export function getDnaUrl(chain: Chain, network: Network) {
  if (chain === "ethereum") {
    if (network === "mainnet") {
      return dnaUrls.ethereum;
    }
    if (network === "sepolia") {
      return dnaUrls.ethereumSepolia;
    }
  }

  if (chain === "beaconchain") {
    if (network === "mainnet") {
      return dnaUrls.beaconchain;
    }
  }

  if (chain === "starknet") {
    if (network === "mainnet") {
      return dnaUrls.starknet;
    }
    if (network === "sepolia") {
      return dnaUrls.starknetSepolia;
    }
  }

  throw new Error(red("✖") + " Invalid chain or network");
}

/**
 * Converts a kebab-case string to camelCase.
 *
 * Examples:
 * - "hello-world" → "helloWorld"
 * - "my-long-variable-name" → "myLongVariableName"
 * - "MY-CAPS" → "myCaps"
 * - "-leading-dash" → "leadingDash"
 * - "trailing-dash-" → "trailingDash"
 * - "double--dash" → "doubleDash"
 * - "hello---world" → "helloWorld"
 * - "mixed_dash-and_underscore" → "mixedDashAndUnderscore"
 *
 * @param str The kebab-case string to convert
 * @returns The camelCase version of the string
 */
export function convertKebabToCamelCase(_str: string): string {
  let str = _str;

  // Handle empty or invalid input
  if (!str || typeof str !== "string") {
    return "";
  }

  // Check if already camelCase
  if (/^[a-z][a-zA-Z0-9]*$/.test(str)) {
    return str;
  }

  // Trim leading/trailing dashes and spaces
  str = str.trim().replace(/^-+|-+$/g, "");

  // Handle empty string after trim
  if (!str) {
    return "";
  }

  return (
    str
      // Replace multiple consecutive dashes/underscores with a single dash
      .replace(/[-_]+/g, "-")
      // Split on dash
      .split("-")
      // Filter out empty strings (from consecutive dashes)
      .filter(Boolean)
      // Convert each word
      .map((word, index) => {
        // Convert word to lowercase
        const _word = word.toLowerCase();

        // Capitalize first letter if not the first word
        if (index > 0) {
          return _word.charAt(0).toUpperCase() + _word.slice(1);
        }

        return _word;
      })
      .join("")
  );
}

export async function checkFileExists(
  path: string,
  askPrompt = false,
  fileName?: string,
): Promise<{
  exists: boolean;
  overwrite: boolean;
}> {
  if (!fs.existsSync(path)) {
    return {
      exists: false,
      overwrite: false,
    };
  }

  if (askPrompt) {
    const { overwrite } = await prompts({
      type: "select",
      name: "overwrite",
      message: `${fileName ?? basename(path)} already exists. Please choose how to proceed:`,
      initial: 0,
      choices: [
        {
          title: "Cancel operation",
          value: "no",
        },
        {
          title: "Overwrite file",
          value: "yes",
        },
      ],
    });

    if (overwrite === "no") {
      cancelOperation();
    }

    return {
      exists: true,
      overwrite: true,
    };
  }

  return {
    exists: true,
    overwrite: false,
  };
}

export function cancelOperation(message?: string) {
  throw new Error(red("✖") + (message ?? " Operation cancelled"));
}
