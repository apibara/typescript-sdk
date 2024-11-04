import { colors } from "consola/utils";
import { relative } from "pathe";

/** Return a (possibly highlighted) path relative to the current working directory.
 *
 * From nitrojs/nitro.
 */
export function prettyPath(path: string, highlight = true) {
  const rel = relative(process.cwd(), path);
  return highlight ? colors.cyan(rel) : rel;
}
