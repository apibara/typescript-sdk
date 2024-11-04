import virtual from "@rollup/plugin-virtual";
import type { Apibara } from "apibara/types";

export function appConfig(apibara: Apibara) {
  return virtual({
    "#apibara-internal-virtual/config": `
    export const config = ${JSON.stringify(apibara.options, null, 2)};
    `,
  });
}
