import type { Apibara, RollupConfig } from "apibara/types";
import { watch } from "chokidar";
import defu from "defu";
import { join } from "pathe";
import { debounce } from "perfect-debounce";
import * as rollup from "rollup";
import { formatRollupError } from "./error";

export async function watchDev(apibara: Apibara, rollupConfig: RollupConfig) {
  let rollupWatcher: rollup.RollupWatcher;

  async function load() {
    if (rollupWatcher) {
      await rollupWatcher.close();
    }
    rollupWatcher = startRollupWatcher(apibara, rollupConfig);
  }
  const reload = debounce(load);

  const watchPatterns = [join(apibara.options.rootDir, "indexers")];

  const watchReloadEvents = new Set(["add", "addDir", "unlink", "unlinkDir"]);
  const reloadWatcher = watch(watchPatterns, { ignoreInitial: true }).on(
    "all",
    (event) => {
      if (watchReloadEvents.has(event)) {
        reload();
      }
    },
  );

  apibara.hooks.hook("close", () => {
    rollupWatcher.close();
    reloadWatcher.close();
  });

  apibara.hooks.hook("rollup:reload", () => reload());

  await load();
}

function startRollupWatcher(apibara: Apibara, rollupConfig: RollupConfig) {
  const watcher = rollup.watch(
    defu(rollupConfig, {
      watch: {
        chokidar: apibara.options.watchOptions,
      },
    }),
  );
  let start: number;

  watcher.on("event", (event) => {
    switch (event.code) {
      // The watcher is (re)starting
      case "START": {
        return;
      }

      // Building an individual bundle
      case "BUNDLE_START": {
        start = Date.now();
        return;
      }

      // Finished building all bundles
      case "END": {
        apibara.hooks.callHook("compiled", apibara);
        apibara.logger.success(
          "Indexers built",
          start ? `in ${Date.now() - start} ms` : "",
        );
        apibara.hooks.callHook("dev:reload");
        return;
      }

      // Encountered an error while bundling
      case "ERROR": {
        apibara.logger.error(formatRollupError(event.error));
      }
    }
  });
  return watcher;
}
