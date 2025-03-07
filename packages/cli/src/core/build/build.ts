import { getRolldownConfig } from "apibara/rolldown";
import type { Apibara } from "apibara/types";
import { watchDev } from "./dev";
import { buildProduction } from "./prod";

export async function build(apibara: Apibara) {
  const rolldownConfig = getRolldownConfig(apibara);

  await apibara.hooks.callHook("rolldown:before", apibara, rolldownConfig);

  return apibara.options.dev
    ? await watchDev(apibara, rolldownConfig)
    : await buildProduction(apibara, rolldownConfig);
}
