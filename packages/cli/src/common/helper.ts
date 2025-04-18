import defu from "defu";
import {
  ENV_INTERNAL_APIBARA_PRESET,
  ENV_INTERNAL_APIBARA_PRESETS,
  ENV_INTERNAL_APIBARA_PROCESSED_RUNTIME,
  ENV_INTERNAL_APIBARA_RUNTIME,
  USER_ENV_APIBARA_RUNTIME_CONFIG,
} from "./constants";

export function getRuntimeDataFromEnv() {
  const processedRuntimeConfig: Record<string, unknown> = JSON.parse(
    process.env[ENV_INTERNAL_APIBARA_PROCESSED_RUNTIME] ?? "{}",
  );
  const preset: string | undefined = process.env[ENV_INTERNAL_APIBARA_PRESET];
  const presets: Record<string, unknown> | undefined = JSON.parse(
    process.env[ENV_INTERNAL_APIBARA_PRESETS] ?? "{}",
  );
  const runtimeConfig: Record<string, unknown> | undefined = JSON.parse(
    process.env[ENV_INTERNAL_APIBARA_RUNTIME] ?? "{}",
  );
  const userEnvRuntimeConfig: Record<string, unknown> | undefined = JSON.parse(
    process.env[USER_ENV_APIBARA_RUNTIME_CONFIG] ?? "{}",
  );

  return {
    userEnvRuntimeConfig,
    processedRuntimeConfig,
    preset,
    presets,
    runtimeConfig,
  };
}

/**
 * Get the merged runtime config from the user env overrided runtime config, presets and defaults.
 * Priority (Highest to lowest):
 * 1. User env overrided runtime config
 * 2. Preset
 * 3. Defaults
 */
export function getProcessedRuntimeConfig({
  preset,
  presets,
  runtimeConfig,
  userEnvRuntimeConfig,
}: {
  preset?: string;
  presets?: Record<string, unknown>;
  runtimeConfig?: Record<string, unknown>;
  userEnvRuntimeConfig?: Record<string, unknown>;
}) {
  let _runtimeConfig: Record<string, unknown> = { ...runtimeConfig };

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

    // Preset applied
    _runtimeConfig = defu(presetValue.runtimeConfig, _runtimeConfig);
  }

  if (userEnvRuntimeConfig) {
    try {
      // Environment runtime config applied
      _runtimeConfig = defu(userEnvRuntimeConfig, _runtimeConfig);
    } catch (error) {
      throw new Error(
        "Failed to parse runtime config from process.env.APIBARA_RUNTIME_CONFIG. Please ensure it is a valid JSON string.",
        { cause: error },
      );
    }
  }

  return _runtimeConfig;
}
