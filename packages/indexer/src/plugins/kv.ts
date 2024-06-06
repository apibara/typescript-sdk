import { useIndexerContext } from "../context";
import { defineIndexerPlugin } from "../plugins";

/** This plugin is a placeholder for a future key-value store plugin. */
export function kv<TFilter, TBlock, TRet>() {
  return defineIndexerPlugin<TFilter, TBlock, TRet>((indexer) => {
    indexer.hooks.hook("run:before", async () => {
      const ctx = useIndexerContext();
      ctx.kv = {};
    });

    indexer.hooks.hook("run:after", async () => {
      console.log("kv: ", useIndexerContext().kv);
    });
  });
}
