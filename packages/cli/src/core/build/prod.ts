import type { Apibara } from "apibara/types";
import { colors } from "consola/utils";
import * as rolldown from "rolldown";

export async function buildProduction(
  apibara: Apibara,
  rolldownConfig: rolldown.RolldownOptions,
) {
  apibara.logger.start(
    `Building ${colors.cyan(apibara.indexers.length)} indexers`,
  );

  const startTime = Date.now();

  try {
    const bundle = await rolldown.rolldown(rolldownConfig);

    if (Array.isArray(rolldownConfig.output)) {
      for (const outputOptions of rolldownConfig.output) {
        await bundle.write(outputOptions);
      }
    } else if (rolldownConfig.output) {
      await bundle.write(rolldownConfig.output as rolldown.OutputOptions);
    } else {
      throw new Error("No output options specified in Rolldown config");
    }

    await bundle.close();

    const endTime = Date.now();
    const duration = endTime - startTime;

    apibara.logger.success(`Build succeeded in ${duration}ms`);
    apibara.logger.info(
      `You can start the indexers with ${colors.cyan("apibara start")}`,
    );
  } catch (error) {
    apibara.logger.error("Build failed", error);
    throw error;
  }
}
