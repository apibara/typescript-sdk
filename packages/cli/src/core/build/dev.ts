import type { Apibara } from "apibara/types";
import { watch } from "chokidar";
import defu from "defu";
import { join } from "pathe";
import { debounce } from "perfect-debounce";
import * as rolldown from "rolldown";
import { formatRolldownError } from "./error";

export async function watchDev(
  apibara: Apibara,
  rolldownConfig: rolldown.RolldownOptions,
) {
  let rolldownWatcher: rolldown.RolldownWatcher;
  async function load() {
    apibara.logger.start("Setting up a dev server");
    if (rolldownWatcher) {
      await rolldownWatcher.close();
    }
    rolldownWatcher = startRolldownWatcher(apibara, rolldownConfig);
  }
  const reload = debounce(async () => await load());

  const watchPatterns = getWatchPatterns(apibara);

  const watchReloadEvents = new Set(["add", "addDir", "unlink", "unlinkDir"]);
  const reloadWatcher = watch(watchPatterns, { ignoreInitial: true }).on(
    "all",
    async (event) => {
      if (watchReloadEvents.has(event)) {
        await reload();
      }
    },
  );

  apibara.hooks.hook("close", () => {
    rolldownWatcher.close();
    reloadWatcher.close();
  });

  apibara.hooks.hook("rolldown:reload", async () => await reload());

  await load();
}

function startRolldownWatcher(
  apibara: Apibara,
  rolldownConfig: rolldown.RolldownOptions,
) {
  const ignorePatterns = getIgnorePatterns(apibara);
  const watcher = rolldown.watch(
    defu(rolldownConfig, {
      watch: {
        exclude: ignorePatterns,
        ...((apibara.options.watchOptions ?? {}) as rolldown.WatchOptions),
      },
    }),
  );
  let start: number;

  watcher.on("event", async (event) => {
    switch (event.code) {
      // The watcher is (re)starting
      case "START": {
        await apibara.hooks.callHook("dev:restart");
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
        await apibara.hooks.callHook("dev:reload");
        return;
      }

      // Encountered an error while bundling
      case "ERROR": {
        apibara.logger.error(formatRolldownError(event.error));
      }
    }
  });
  return watcher;
}

const getWatchPatterns = (apibara: Apibara) => [
  join(apibara.options.rootDir, "indexers"),
];

const getIgnorePatterns = (apibara: Apibara) => [
  "**/.apibara/**",
  "**/.git/**",
  "**/.DS_Store",
  "**/node_modules/**",
  "**/dist/**",
  "**/.turbo/**",
];
