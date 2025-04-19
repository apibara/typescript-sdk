import virtual from "@rollup/plugin-virtual";
import { USER_ENV_APIBARA_RUNTIME_CONFIG } from "apibara/common";
import type { Apibara } from "apibara/types";
import type { RolldownPluginOption } from "rolldown";

export function staticConfig(apibara: Apibara) {
  const presetString = apibara.options.preset ?? "";
  const presetsStringified = JSON.stringify(apibara.options.presets ?? {});
  const runtimeConfigStringified = JSON.stringify(
    apibara.options.runtimeConfig ?? {},
  );

  return virtual({
    "#apibara-internal-virtual/static-config": `
    export const preset = ${presetString ? `"${presetString}"` : "undefined"};
    export const presets = ${presetsStringified};
    export const runtimeConfig = ${runtimeConfigStringified};
    export const userEnvRuntimeConfig = JSON.parse(process.env.${USER_ENV_APIBARA_RUNTIME_CONFIG} ?? "{}");
    `,
  }) as RolldownPluginOption;
}
