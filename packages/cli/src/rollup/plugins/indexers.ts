import virtual from "@rollup/plugin-virtual";
import type { Apibara } from "apibara/types";

export function indexers(apibara: Apibara) {
  const indexers = [...new Set(apibara.indexers)];

  return virtual({
    "#apibara-internal-virtual/indexers": `
    ${indexers.map((i) => `import ${i.name} from '${i.indexer}';`).join("\n")}

    export const indexers = [
      ${indexers.map((i) => `{ name: "${i.name}", indexer: ${i.name} }`).join(",\n")}
    ];
    `,
  });
}
