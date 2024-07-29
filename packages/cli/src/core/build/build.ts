import { getRollupConfig } from "../../rollup/config";
import type { Apibara } from "../../types/apibara";
import { buildProduction } from "./prod";

export async function build(apibara: Apibara) {
  const rollupConfig = getRollupConfig(apibara);
  return await buildProduction(apibara, rollupConfig);
}
