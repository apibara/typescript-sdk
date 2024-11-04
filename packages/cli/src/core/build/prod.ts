import type { Apibara, RollupConfig } from "apibara/types";
import { colors } from "consola/utils";
import { type OutputOptions, rollup } from "rollup";

export async function buildProduction(
  apibara: Apibara,
  rollupConfig: RollupConfig,
) {
  apibara.logger.start(
    `Building ${colors.cyan(apibara.indexers.length)} indexers`,
  );

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
    apibara.logger.info(
      `You can start the indexers with ${colors.cyan("apibara start")}`,
    );
  } catch (error) {
    apibara.logger.error("Build failed", error);
    throw error;
  }
}
