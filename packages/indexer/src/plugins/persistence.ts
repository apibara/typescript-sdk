import { type Cursor, isCursor } from "@apibara/protocol";

import { defineIndexerPlugin } from "./config";

/**
 * A plugin that persists the last cursor and filter to memory.
 */
export function inMemoryPersistence<TFilter, TBlock>() {
  return defineIndexerPlugin<TFilter, TBlock>((indexer) => {
    let lastCursor: Cursor | undefined;
    let lastFilter: TFilter | undefined;

    indexer.hooks.hook("connect:before", ({ request }) => {
      if (lastCursor) {
        request.startingCursor = lastCursor;
      }

      if (lastFilter) {
        request.filter[1] = lastFilter;
      }
    });

    indexer.hooks.hook("connect:factory", ({ request, endCursor }) => {
      if (request.filter[1]) {
        lastCursor = endCursor;
        lastFilter = request.filter[1];
      }
    });

    indexer.hooks.hook("handler:middleware", ({ use }) => {
      use(async (context, next) => {
        await next();
        if (context.endCursor && isCursor(context.endCursor)) {
          lastCursor = context.endCursor;
        }
      });
    });
  });
}
