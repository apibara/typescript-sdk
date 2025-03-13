import type { ApibaraOptions } from "apibara/types";
import { serialize } from "../../../utils/helper";

export async function resolveRuntimeConfigOptions(options: ApibaraOptions) {
  const { preset, presets } = options;
  let runtimeConfig: Record<string, unknown> = { ...options.runtimeConfig };

  if (preset) {
    if (presets === undefined) {
      throw new Error(
        `Specified preset "${preset}" but no presets were defined`,
      );
    }

    if (presets[preset] === undefined) {
      throw new Error(`Specified preset "${preset}" but it was not defined`);
    }

    const presetValue = presets[preset] as {
      runtimeConfig: Record<string, unknown>;
    };
    runtimeConfig = { ...runtimeConfig, ...presetValue.runtimeConfig };
  }
  process.env.APIBARA_RUNTIME_CONFIG = serialize(runtimeConfig);
}
