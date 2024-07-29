import type { Apibara, ApibaraDynamicConfig } from "apibara/types";

export async function updateApibaraConfig(
  apibara: Apibara,
  config: ApibaraDynamicConfig,
) {
  // Do something
  // await apibara.hooks.callHook("rollup:reload");
  // consola.success("Apibara config hot reloaded!");
}
