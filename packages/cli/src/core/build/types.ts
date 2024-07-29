import { type JSValue, generateTypes, resolveSchema } from "untyped";
import type { Apibara } from "../../types/apibara";

export async function writeTypes(apibara: Apibara) {
  // TODO write to a file
  const type = generateTypes(
    await resolveSchema(
      Object.fromEntries(
        Object.entries(apibara.options.runtimeConfig),
      ) as Record<string, JSValue>,
    ),
    {
      interfaceName: "ApibaraRuntimeConfig",
      addExport: false,
      addDefaults: false,
      allowExtraKeys: false,
      indentation: 2,
    },
  );

  console.log("apibara ---> ", apibara);
  console.log("type ---> ", type);
}
