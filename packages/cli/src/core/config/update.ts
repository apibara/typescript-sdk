import type { Apibara, ApibaraDynamicConfig } from "apibara/types";
import { runtimeConfigResolver } from "./resolvers/runtime.resolver";

export async function updateApibaraConfig(
  apibara: Apibara,
  newConfig: ApibaraDynamicConfig,
) {
  // applies new config values to env again during hot reload
  runtimeConfigResolver(newConfig);
  apibara.logger.success("Apibara config hot reloaded!");
  // we simply stop indexers and restart them with updated runtime values
  await apibara.hooks.callHook("dev:reload");
}
