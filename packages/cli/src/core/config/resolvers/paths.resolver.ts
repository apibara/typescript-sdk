import type { ApibaraOptions } from "apibara/types";
import { resolve } from "pathe";

export async function resolvePathOptions(options: ApibaraOptions) {
  options.rootDir = resolve(options.rootDir || ".");

  for (const key of ["buildDir"] as const) {
    options[key] = resolve(options.rootDir, options[key]);
  }

  if (!options.outputDir) {
    options.outputDir = resolve(options.rootDir, ".apibara/build");
  }
}
