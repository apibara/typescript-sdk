import { defineIndexerPlugin, useLogger } from "@apibara/indexer/plugins";
import { node } from "@elysiajs/node";
import { Elysia } from "elysia";

export type IndexerHealthState =
  | "starting"
  | "connecting"
  | "running"
  | "stopped";

export type HealthPluginOptions = {
  /**
   * Port for the health HTTP server.
   * @default 9090
   */
  port?: number;
};

/**
 * Plugin that exposes a /health HTTP endpoint reflecting the indexer lifecycle.
 *
 * State machine:
 *   starting -- run:before ---> connecting -- connect:after ---> running -- run:after ---> stopped
 *
 * HTTP responses:
 *   - starting / connecting / stopped: 503
 *   - running                        : 200
 *
 * @param options.port - Port to listen on (default: 9090)
 */
export function healthPlugin<TFilter, TBlock>(options?: HealthPluginOptions) {
  const port = options?.port ?? 9090;

  return defineIndexerPlugin<TFilter, TBlock>((indexer) => {
    let state: IndexerHealthState = "starting";

    const app = new Elysia({ adapter: node() }).get("/health", ({ set }) => {
      if (state === "running") {
        set.status = 200;
        return { message: "indexer is running" };
      }
      set.status = 503;
      return { message: `indexer is ${state}` };
    });

    indexer.hooks.hook("plugins:init", async () => {
      const logger = useLogger();

      app.listen(port);
      logger.info(`Health server listening on port ${port}`);
    });

    indexer.hooks.hook("run:before", async () => {
      state = "connecting";
    });

    indexer.hooks.hook("connect:after", async () => {
      state = "running";
    });

    indexer.hooks.hook("run:after", async () => {
      state = "stopped";
      try {
        await app.stop();
      } catch {}
    });
  });
}
