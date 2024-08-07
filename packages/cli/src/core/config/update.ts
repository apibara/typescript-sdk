import type { Apibara, ApibaraDynamicConfig } from "apibara/types";
import consola from "consola";

export async function updateApibaraConfig(
  apibara: Apibara,
  config: ApibaraDynamicConfig,
) {
  await apibara.hooks.callHook("rollup:reload");
  consola.success("Apibara config hot reloaded!");
}
