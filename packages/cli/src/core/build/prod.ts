import type { Apibara, RollupConfig } from "apibara/types";
import consola from "consola";
import { type OutputOptions, rollup } from "rollup";

export async function buildProduction(
  apibara: Apibara,
  rollupConfig: RollupConfig,
) {
  try {
    // Create a bundle
    const bundle = await rollup(rollupConfig);

    // Generate output
    if (Array.isArray(rollupConfig.output)) {
      for (const outputOptions of rollupConfig.output) {
        await bundle.write(outputOptions);
      }
    } else if (rollupConfig.output) {
      await bundle.write(rollupConfig.output as OutputOptions);
    } else {
      throw new Error("No output options specified in Rollup config");
    }

    // Close the bundle
    await bundle.close();

    consola.success("Build completed successfully!");
  } catch (error) {
    console.error("Build failed:", error);
    throw error;
  }
}
