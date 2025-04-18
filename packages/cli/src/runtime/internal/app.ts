import { createIndexer as _createIndexer } from "@apibara/indexer";
import {
  type InternalContext,
  internalContext,
} from "@apibara/indexer/internal/plugins";
import {
  type ConsolaReporter,
  inMemoryPersistence,
  logger,
} from "@apibara/indexer/plugins";
import {
  type CreateClientOptions,
  Metadata,
  type StreamConfig,
  createClient,
} from "@apibara/protocol";
import consola from "consola";
import { indexers } from "#apibara-internal-virtual/indexers";
import { logger as instrumentationLogger } from "#apibara-internal-virtual/instrumentation";
import { createLogger } from "./logger";

export const availableIndexers = indexers.map((i) => i.name);

export function createIndexer({
  indexerName,
  processedRuntimeConfig,
  preset,
}: {
  indexerName: string;
  /**
   * Final processed runtime config to be used by the indexer
   */
  processedRuntimeConfig: Record<string, unknown>;
  /**
   * Preset name which was used to generate the runtime config
   */
  preset?: string;
}) {
  const indexerDefinition = indexers.find((i) => i.name === indexerName);

  if (indexerDefinition === undefined) {
    throw new Error(
      `Specified indexer "${indexerName}" but it was not defined`,
    );
  }

  const indexerModule = indexerDefinition.indexer?.default;
  if (indexerModule === undefined) {
    consola.warn(
      `Specified indexer "${indexerName}" but it does not export a default. Ignoring.`,
    );
    return;
  }

  const definition =
    typeof indexerModule === "function"
      ? indexerModule(processedRuntimeConfig)
      : indexerModule;

  let reporter: ConsolaReporter = createLogger({
    indexer: indexerName,
    preset,
    indexers: availableIndexers,
  });

  // Check if a custom logger is provided through instrumentation
  if (instrumentationLogger) {
    // Create a reporter using the custom logger function
    const _reporter = instrumentationLogger({
      indexer: indexerName,
      preset,
      indexers: availableIndexers,
    });

    // If the reporter is valid (has a log method), use it instead of the default
    if (_reporter && "log" in _reporter) {
      reporter = _reporter;
    }
  }

  // Put the in-memory persistence plugin first so that it can be overridden by any user-defined
  // persistence plugin.
  definition.plugins = [
    internalContext({
      indexerName,
      availableIndexers,
    } as InternalContext),
    logger({ logger: reporter }),
    inMemoryPersistence(),
    ...(definition.plugins ?? []),
  ];

  return {
    indexer: _createIndexer(definition),
    logger: consola.create({ reporters: [reporter] }),
  };
}

export function createAuthenticatedClient(
  config: StreamConfig<unknown, unknown>,
  streamUrl: string,
  options?: CreateClientOptions,
) {
  const dnaToken = process.env.DNA_TOKEN;
  if (!dnaToken) {
    consola.warn(
      "DNA_TOKEN environment variable is not set. Trying to connect without authentication.",
    );
  }

  return createClient(config, streamUrl, {
    ...options,
    defaultCallOptions: {
      ...(options?.defaultCallOptions ?? {}),
      "*": {
        metadata: Metadata({
          Authorization: `Bearer ${dnaToken}`,
        }),
        // metadata cant be overrided with spread as its a class so we override it fully if user provided it.
        ...(options?.defaultCallOptions?.["*"] ?? {}),
      },
    },
  });
}
