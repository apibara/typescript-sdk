import { useIndexerContext } from "../context";
import type { KVStore } from "../plugins/kv";

export type UseKVStoreResult = InstanceType<typeof KVStore>;

export function useKVStore(): UseKVStoreResult {
  const ctx = useIndexerContext();

  if (!ctx?.kv) throw new Error("KV Plugin is not available in context!");

  return ctx.kv;
}
