export function useRuntimeConfig() {
  return JSON.parse(process.env.APIBARA_RUNTIME_CONFIG || "{}");
}
