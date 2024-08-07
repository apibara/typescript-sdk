import { getRollupConfig } from "apibara/rollup";
import type { Apibara } from "apibara/types";
import { watchDev } from "./dev";
import { buildProduction } from "./prod";

export async function build(apibara: Apibara) {
  const rollupConfig = getRollupConfig(apibara);
  await apibara.hooks.callHook("rollup:before", apibara, rollupConfig);
  return apibara.options.dev
    ? await watchDev(apibara, rollupConfig)
    : await buildProduction(apibara, rollupConfig);
}
