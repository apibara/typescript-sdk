import { getRolldownConfig } from "apibara/rolldown";
import type { Apibara } from "apibara/types";
import { colors } from "consola/utils";
import { watchDev } from "./dev";
import { buildProduction } from "./prod";

export async function build(apibara: Apibara) {
  const rolldownConfig = getRolldownConfig(apibara);

  await apibara.hooks.callHook("rolldown:before", apibara, rolldownConfig);

  if (apibara.options.rollupConfig) {
    apibara.logger.error(
      `\n${colors.cyan("apibara.config:")} rollupConfig is deprecated. Use rolldownConfig instead`,
    );
    process.exit(1);
  }

  return apibara.options.dev
    ? await watchDev(apibara, rolldownConfig)
    : await buildProduction(apibara, rolldownConfig);
}
