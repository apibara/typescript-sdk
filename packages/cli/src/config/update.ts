import type { Apibara } from "../types/apibara";
import type { ApibaraDynamicConfig } from "../types/config";

export async function updateApibaraConfig(
  apibara: Apibara,
  config: ApibaraDynamicConfig,
) {
  // Do something
  // await apibara.hooks.callHook("rollup:reload");
  // consola.success("Apibara config hot reloaded!");
}
