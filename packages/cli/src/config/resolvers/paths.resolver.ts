import { resolve } from "pathe";
import type { ApibaraOptions } from "../../types/config";

export async function resolvePathOptions(options: ApibaraOptions) {
  options.rootDir = resolve(options.rootDir || ".");
}
