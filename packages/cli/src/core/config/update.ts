import type { Apibara, ApibaraDynamicConfig } from "apibara/types";

export async function updateApibaraConfig(
  apibara: Apibara,
  _config: ApibaraDynamicConfig,
) {
  await apibara.hooks.callHook("rollup:reload");
  apibara.logger.success("Apibara config hot reloaded!");
}
