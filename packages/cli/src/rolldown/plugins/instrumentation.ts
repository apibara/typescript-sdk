import { existsSync } from "node:fs";
import { join } from "node:path";
import virtual from "@rollup/plugin-virtual";
import type { Apibara } from "apibara/types";
import type { RolldownPluginOption } from "rolldown";

export function instrumentation(apibara: Apibara) {
  const instrumentationPath = join(
    apibara.options._c12.cwd!,
    `instrumentation.${apibara.options._c12.configFile?.endsWith(".ts") ? "ts" : "js"}`,
  );

  if (!existsSync(instrumentationPath)) {
    return virtual({
      "#apibara-internal-virtual/instrumentation": `
      let register = undefined;
      let logger = undefined;
  
      export { register, logger };
      `,
    }) as RolldownPluginOption;
  }

  /**
   * We are importing the instrumentation file inline with "require" instead of "import" at the top of the file to avoid warnings from rolldown
   * when some methods are not defined in the instrumentation file.
   *
   * Example warning:
   * 
   * [IMPORT_IS_UNDEFINED] Warning: Import `logger` will always be undefined because there is no matching export in 'instrumentation.ts'
   *     ╭─[virtual:#apibara-internal-virtual/instrumentation:11:35]
   *     │
   *  11 │     if (instrumentation && typeof instrumentation.logger === "function") {
   *     │                                   ───────────┬──────────  
   *     │                                              ╰──────────── 
   * ────╯

  * [IMPORT_IS_UNDEFINED] Warning: Import `logger` will always be undefined because there is no matching export in 'instrumentation.ts'
  *     ╭─[virtual:#apibara-internal-virtual/instrumentation:12:16]
  *     │
  *  12 │       logger = instrumentation.logger;
  *     │                ───────────┬──────────  
  *     │                           ╰──────────── 
  * ────╯ 
  */
  return virtual({
    "#apibara-internal-virtual/instrumentation": `
    let register = undefined;
    let logger = undefined;

    try {
      const instrumentation = require('${instrumentationPath}');
      
      if (instrumentation?.register && typeof instrumentation.register === "function") {
        register = instrumentation.register;
      }
      
      if (instrumentation?.logger && typeof instrumentation.logger === "function") {
        logger = instrumentation.logger;
      }
    } catch {
      // Silently handle any require errors
    }

    export { register, logger };
    `,
  }) as RolldownPluginOption;
}
