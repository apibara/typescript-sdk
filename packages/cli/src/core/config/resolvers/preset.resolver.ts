import defu from "defu";
import type { ApibaraOptions } from "apibara/types";

export async function presetResolver(options: ApibaraOptions) {
  if (options.preset && options.presets?.[options.preset]) {
    const new_options = defu(options.presets[options.preset], options);
    Object.assign(options, new_options);
  }
}
