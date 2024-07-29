import { getRollupConfig } from "apibara/rollup";
import type { Apibara } from "apibara/types";
import { buildProduction } from "./prod";

export async function build(apibara: Apibara) {
  const rollupConfig = getRollupConfig(apibara);
  return await buildProduction(apibara, rollupConfig);
}
