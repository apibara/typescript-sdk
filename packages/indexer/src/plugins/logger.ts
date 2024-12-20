import { type ConsolaInstance, type ConsolaReporter, consola } from "consola";
import { useIndexerContext } from "../context";
import { defineIndexerPlugin } from "./config";

export type { ConsolaReporter, ConsolaInstance } from "consola";

export function logger<TFilter, TBlock, TTxnParams>({
  logger,
}: { logger?: ConsolaReporter } = {}) {
  return defineIndexerPlugin<TFilter, TBlock>((indexer) => {
    indexer.hooks.hook("run:before", () => {
      const ctx = useIndexerContext();

      if (logger) {
        ctx.logger = consola.create({ reporters: [logger] });
      } else {
        ctx.logger = consola.create({});
      }
    });
  });
}

export function useLogger(): ConsolaInstance {
  const ctx = useIndexerContext();

  if (!ctx?.logger)
    throw new Error("Logger plugin is not available in context");

  return ctx.logger;
}
