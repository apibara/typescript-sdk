import {
  http,
  type HttpTransport,
  type HttpTransportConfig,
  type RpcSchema,
} from "viem";

/**
 * @description Creates a rate-limited HTTP transport that connects to a JSON-RPC API.
 */
export function rateLimitedHttp<
  rpcSchema extends RpcSchema | undefined = undefined,
  raw extends boolean = false,
>(
  /** URL of the JSON-RPC API. Defaults to the chain's public RPC URL. */
  url?: string | undefined,
  config: HttpTransportConfig<rpcSchema, raw> & { rps?: number } = {},
): HttpTransport<rpcSchema, raw> {
  const { onFetchRequest, onFetchResponse, ...rest } = config;

  const rps = config.rps ?? 10;

  const limiter = createRateLimiter({
    capacity: rps,
    refillRate: rps,
  });

  return http(url, {
    ...rest,
    async onFetchRequest(request, init) {
      await limiter.acquireOne();
      await onFetchRequest?.(request, init);
    },
    async onFetchResponse(response) {
      await onFetchResponse?.(response);
    },
  });
}

function createRateLimiter({
  capacity,
  refillRate,
  refillInterval: refillInterval_,
  lastRefillTime: startingRefillTime,
}: {
  capacity: number;
  refillRate: number;
  refillInterval?: number;
  lastRefillTime?: number;
}) {
  const refillInterval = refillInterval_ ?? 100;

  let tokens = capacity;
  let lastRefillTime = startingRefillTime ?? Date.now();

  function refill(now: number) {
    const elapsed = (now - lastRefillTime) / 1_000;
    const newTokens = elapsed * refillRate;
    tokens = Math.min(capacity, tokens + newTokens);
    lastRefillTime = now;
  }

  return {
    available() {
      return tokens;
    },
    // Wait for a single token to become available.
    async acquireOne(now?: number) {
      while (true) {
        refill(now ?? Date.now());
        if (tokens > 0) {
          tokens -= 1;
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, refillInterval));
      }
    },
  };
}
