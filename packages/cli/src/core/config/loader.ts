import type {
  ApibaraConfig,
  ApibaraOptions,
  LoadConfigOptions,
} from "apibara/types";
import { loadConfig, watchConfig } from "c12";
import { klona } from "klona/full";
import { ApibaraDefaults } from "./defaults";
import { resolvePathOptions } from "./resolvers/paths.resolver";

const configResolvers = [resolvePathOptions] as const;

export async function loadOptions(
  configOverrides: ApibaraConfig = {},
  opts: LoadConfigOptions = {},
  dev = false,
): Promise<ApibaraOptions> {
  const options = await _loadUserConfig(configOverrides, opts, dev);

  // Check if the runtimeConfig is serializable
  try {
    JSON.stringify(options.runtimeConfig);
  } catch (error) {
    throw new Error(
      "Non-serializable runtimeConfig. Please ensure the config is serializable.",
      { cause: error },
    );
  }

  for (const resolver of configResolvers) {
    await resolver(options);
  }

  return options;
}

async function _loadUserConfig(
  configOverrides: ApibaraConfig = {},
  opts: LoadConfigOptions = {},
  dev = false,
): Promise<ApibaraOptions> {
  // biome-ignore lint: noParameterAssign
  configOverrides = klona(configOverrides);

  const loadedConfig = await (opts.watch
    ? watchConfig<ApibaraConfig>
    : loadConfig<ApibaraConfig>)({
    name: "apibara",
    dotenv: dev,
    cwd: configOverrides.rootDir,
    overrides: {
      ...configOverrides,
    },
    defaults: { ...ApibaraDefaults },
    ...opts.c12,
  });

  const options = klona(loadedConfig.config) as ApibaraOptions;

  options._config = configOverrides;
  options._c12 = loadedConfig;

  if (dev) {
    options.dev = dev;
  }

  return options;
}
