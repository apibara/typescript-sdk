import { useIndexerContext } from "../context";
import { defineIndexerPlugin } from "./config";

export const INTERNAL_CONTEXT_PROPERTY = "_internal";

export function internalContext<TFilter, TBlock, TTxnParams>(
  values: Record<string, unknown>,
) {
  return defineIndexerPlugin<TFilter, TBlock>((indexer) => {
    indexer.hooks.hook("run:before", () => {
      try {
        const ctx = useIndexerContext();
        ctx[INTERNAL_CONTEXT_PROPERTY] = {
          ...(ctx[INTERNAL_CONTEXT_PROPERTY] || {}),
          ...values,
        };
      } catch (error) {
        throw new Error("Failed to set internal context", {
          cause: error,
        });
      }
    });
  });
}

export type InternalContext = {
  indexerName: string;
  availableIndexers: string[];
};

export function useInternalContext(): InternalContext {
  const ctx = useIndexerContext();

  if (ctx[INTERNAL_CONTEXT_PROPERTY] === undefined) {
    throw new Error(
      "Internal context is not available, possibly 'internalContext' plugin is missing!",
    );
  }
  return ctx[INTERNAL_CONTEXT_PROPERTY];
}
