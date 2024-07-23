import type { ApibaraOptions } from "../../types/config";

export async function presetResolver(options: ApibaraOptions) {
  const updateOptions = {
    ...options,
    ...(options.preset ? options.presets?.[options.preset] : {}),
  };

  Object.assign(options, updateOptions);
}
