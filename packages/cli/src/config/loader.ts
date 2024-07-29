import { loadConfig, watchConfig } from "c12";
import { klona } from "klona/full";
import type {
  ApibaraConfig,
  ApibaraOptions,
  LoadConfigOptions,
} from "../types/config";
import { ApibaraDefaults } from "./defaults";
import { resolvePathOptions } from "./resolvers/paths.resolver";
import { presetResolver } from "./resolvers/preset.resolver";
import { resolveRuntimeConfigOptions } from "./resolvers/runtime-config.resolver";

const configResolvers = [
  resolvePathOptions,
  resolveRuntimeConfigOptions,
  presetResolver,
] as const;

export async function loadOptions(
  configOverrides: ApibaraConfig = {},
  opts: LoadConfigOptions = {},
): Promise<ApibaraOptions> {
  const options = await _loadUserConfig(configOverrides, opts);
  for (const resolver of configResolvers) {
    await resolver(options);
  }
  return options;
}

async function _loadUserConfig(
  configOverrides: ApibaraConfig = {},
  opts: LoadConfigOptions = {},
): Promise<ApibaraOptions> {
  // biome-ignore lint: noParameterAssign
  configOverrides = klona(configOverrides);

  const loadedConfig = await (opts.watch
    ? watchConfig<ApibaraConfig>
    : loadConfig<ApibaraConfig>)({
    name: "apibara",
    // path from where apibara.config.ts is loaded
    // defautl is "." path
    // cwd: configOverrides.rootDir,
    overrides: {
      ...configOverrides,
    },
    defaults: { ...ApibaraDefaults },
    ...opts.c12,
  });

  const options = klona(loadedConfig.config) as ApibaraOptions;

  options._config = configOverrides;
  options._c12 = loadedConfig;

  return options;
}
