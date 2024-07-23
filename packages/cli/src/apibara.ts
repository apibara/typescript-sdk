import consola from "consola";
import { createHooks } from "hookable";
import { loadOptions } from "./config/loader";
import { updateApibaraConfig } from "./config/update";
import type { Apibara } from "./types/apibara";
import type {
  ApibaraConfig,
  ApibaraDynamicConfig,
  LoadConfigOptions,
} from "./types/config";

export async function createApibara(
  config: ApibaraConfig = {},
  opts: LoadConfigOptions = {},
): Promise<Apibara> {
  // load options
  const options = await loadOptions(config, opts);

  // create apibara context
  const apibara: Apibara = {
    options,
    hooks: createHooks(),
    close: () => apibara.hooks.callHook("close"),
    logger: consola.withTag("apibara"),
    async updateConfig(config: ApibaraDynamicConfig) {
      updateApibaraConfig(apibara, config);
    },
  };

  apibara.hooks.addHooks(apibara.options.hooks);

  // TODO
  return apibara;
}
