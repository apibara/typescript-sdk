import type { Apibara, RollupConfig } from "apibara/types";
import { type OutputOptions, rollup } from "rollup";

export async function buildProduction(
  apibara: Apibara,
  rollupConfig: RollupConfig,
) {
  apibara.logger.start("Building indexers");
  try {
    const bundle = await rollup(rollupConfig);

    if (Array.isArray(rollupConfig.output)) {
      for (const outputOptions of rollupConfig.output) {
        await bundle.write(outputOptions);
      }
    } else if (rollupConfig.output) {
      await bundle.write(rollupConfig.output as OutputOptions);
    } else {
      throw new Error("No output options specified in Rollup config");
    }

    await bundle.close();

    apibara.logger.success("Build succeeded!");
  } catch (error) {
    apibara.logger.error("Build failed", error);
    throw error;
  }
}
