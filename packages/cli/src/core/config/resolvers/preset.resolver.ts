import type { ApibaraOptions } from "apibara/types";
import defu from "defu";

/**
 * @note This resolver is not in use currently, as we resolve presets in runtime files.
 */
export async function presetResolver(options: ApibaraOptions) {
  if (options.preset && options.presets?.[options.preset]) {
    const new_options = defu(options.presets[options.preset], options);
    Object.assign(options, new_options);
  }
}
