import {
  ENV_INTERNAL_APIBARA_PRESET,
  ENV_INTERNAL_APIBARA_PRESETS,
  ENV_INTERNAL_APIBARA_PROCESSED_RUNTIME,
  ENV_INTERNAL_APIBARA_RUNTIME,
  USER_ENV_APIBARA_RUNTIME_CONFIG,
  getProcessedRuntimeConfig,
} from "apibara/common";
import type { ApibaraOptions } from "apibara/types";

export function runtimeConfigResolver(options: Partial<ApibaraOptions>) {
  try {
    const { runtimeConfig, preset, presets } = options;

    if (runtimeConfig) {
      process.env[ENV_INTERNAL_APIBARA_RUNTIME] = JSON.stringify(runtimeConfig);
    }
    if (preset) {
      process.env[ENV_INTERNAL_APIBARA_PRESET] = preset;
    }

    if (presets) {
      process.env[ENV_INTERNAL_APIBARA_PRESETS] = JSON.stringify(presets);
    }

    const userEnvRuntimeConfig = JSON.parse(
      process.env[USER_ENV_APIBARA_RUNTIME_CONFIG] ?? "{}",
    );

    // This is final processed runtime config that will be used by the indexer and useRuntimeConfig hook
    process.env[ENV_INTERNAL_APIBARA_PROCESSED_RUNTIME] = JSON.stringify(
      getProcessedRuntimeConfig({
        preset,
        presets,
        runtimeConfig,
        userEnvRuntimeConfig,
      }),
    );
  } catch (error) {
    throw new Error("Failed to process & set runtime environment variables", {
      cause: error,
    });
  }
}
