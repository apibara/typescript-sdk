import { useIndexerContext } from "../context";
import type { KVStore } from "../plugins/kv";

export type UseKVStoreResult<T> = InstanceType<typeof KVStore<T>>;

export function useKVStore<T>(): UseKVStoreResult<T> {
  const ctx = useIndexerContext();

  if (!ctx?.kv) throw new Error("KV Plugin is not available in context!");

  return ctx.kv;
}
