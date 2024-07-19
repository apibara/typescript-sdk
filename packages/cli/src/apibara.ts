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
) {
  const options = await loadOptions(config, opts);

  // create apibara context
  const apibara: Apibara = {
    options,
    hooks: createHooks(),
    close: async () => {},
    async updateConfig(config: ApibaraDynamicConfig) {
      updateApibaraConfig(apibara, config);
    },
  };

  // TODO
  return apibara;
}
