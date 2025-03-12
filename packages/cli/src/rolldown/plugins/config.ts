import virtual from "@rollup/plugin-virtual";
import type { Apibara } from "apibara/types";
import type { RolldownPluginOption } from "rolldown";

export function appConfig(apibara: Apibara) {
  return virtual({
    "#apibara-internal-virtual/config": `
    const _config = process.env.APIBARA_CONFIG;

    if (_config === undefined) {
      throw new Error("APIBARA_CONFIG is not defined");
    }

    export const config = _config;
    `,
  }) as RolldownPluginOption;
}
