import defu from "defu";

/**
 * Get the merged runtime config from the process.env.APIBARA_RUNTIME_CONFIG, presets and defaults.
 * Priority (Highest to lowest):
 * 1. process.env.APIBARA_RUNTIME_CONFIG
 * 2. Preset
 * 3. Defaults
 */
export function getProcessedRuntimeConfig({
  preset,
  presets,
  runtimeConfig,
}: {
  preset?: string;
  presets?: Record<string, unknown>;
  runtimeConfig?: Record<string, unknown>;
}) {
  let _runtimeConfig: Record<string, unknown> = { ...runtimeConfig };
  const envRuntimeConfig = process.env.APIBARA_RUNTIME_CONFIG;

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

  if (envRuntimeConfig) {
    try {
      // Environment runtime config applied
      const envRuntimeConfigValue = JSON.parse(envRuntimeConfig);
      _runtimeConfig = defu(envRuntimeConfigValue, _runtimeConfig);
    } catch (error) {
      throw new Error(
        "Failed to parse runtime config from process.env.APIBARA_RUNTIME_CONFIG. Please ensure it is a valid JSON string.",
        { cause: error },
      );
    }
  }

  return _runtimeConfig;
}
