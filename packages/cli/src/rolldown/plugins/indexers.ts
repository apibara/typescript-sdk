import virtual from "@rollup/plugin-virtual";
import type { Apibara } from "apibara/types";
import { hash } from "ohash";
import type { RolldownPluginOption } from "rolldown";

export function indexers(apibara: Apibara) {
  const indexers = [...new Set(apibara.indexers)];
  return virtual({
    "#apibara-internal-virtual/indexers": `
    ${indexers.map((i) => `import * as _${hash(i)} from '${i.indexer}';`).join("\n")}

    export const indexers = [
      ${indexers.map((i) => `{ name: "${i.name}", indexer: _${hash(i)} }`).join(",\n")}
    ];
    `,
  }) as RolldownPluginOption;
}
