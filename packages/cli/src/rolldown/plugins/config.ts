import virtual from "@rollup/plugin-virtual";
import type { Apibara } from "apibara/types";
import type { RolldownPluginOption } from "rolldown";

export function appConfig(apibara: Apibara) {
  return virtual({
    "#apibara-internal-virtual/config": `
    const serializedConfig = \`process.env.APIBARA_CONFIG\`;

    if (serializedConfig === undefined || serializedConfig === "") {
      throw new Error("APIBARA_CONFIG is not defined");
    }

    function deserialize(str) {
      return JSON.parse(str, (_, value) =>
        typeof value === "string" && value.match(/^\\d+n$/)
          ? BigInt(value.slice(0, -1))
          : value,
      );
    }

    export const config = deserialize(serializedConfig);
    `,
  }) as RolldownPluginOption;
}
