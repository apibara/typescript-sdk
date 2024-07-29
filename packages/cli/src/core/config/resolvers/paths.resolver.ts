import { resolve } from "pathe";
import type { ApibaraOptions } from "apibara/types";

export async function resolvePathOptions(options: ApibaraOptions) {
  options.rootDir = resolve(options.rootDir || ".");
}
