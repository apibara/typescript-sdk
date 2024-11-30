import type {
  Apibara,
  ApibaraConfig,
  ApibaraDynamicConfig,
  LoadConfigOptions,
} from "apibara/types";
import consola from "consola";
import { createHooks } from "hookable";
import { loadOptions } from "./config/loader";
import { updateApibaraConfig } from "./config/update";
import { scanIndexers } from "./scan";

export async function createApibara(
  config: ApibaraConfig = {},
  opts: LoadConfigOptions = {},
  dev = false,
): Promise<Apibara> {
  const options = await loadOptions(config, opts, dev);

  const apibara: Apibara = {
    options,
    indexers: [],
    hooks: createHooks(),
    close: () => apibara.hooks.callHook("close"),
    logger: consola.withTag("apibara"),
    async updateConfig(config: ApibaraDynamicConfig) {
      updateApibaraConfig(apibara, config);
    },
  };

  apibara.hooks.addHooks(apibara.options.hooks);

  await scanIndexers(apibara);

  return apibara;
}
