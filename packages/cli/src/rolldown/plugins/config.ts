import virtual from "@rollup/plugin-virtual";
import type { Apibara } from "apibara/types";
import type { RolldownPluginOption } from "rolldown";

export function appConfig(apibara: Apibara) {
  return virtual({
    "#apibara-internal-virtual/config": `
    import * as projectConfig from '${apibara.options._c12.configFile}';

    export const config = projectConfig.default;
    `,
  }) as RolldownPluginOption;
}
