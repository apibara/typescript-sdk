import type { ApibaraOptions } from "apibara/types";
import { resolve } from "pathe";

export async function resolvePathOptions(options: ApibaraOptions) {
  options.rootDir = resolve(options.rootDir || ".");
}
