import { matchesEventFilter, normalizeEvent, normalizeFelt } from "./normalize";
import type {
  EventFilter,
  Felt,
  GetEventsOptions,
  GetEventsPage,
  RpcEvent,
} from "./types";

type JsonRpcId = number | string | null;

interface JsonRpcRequestOptions {
  id?: JsonRpcId;
  signal?: AbortSignal;
}

interface JsonRpcCallOptions extends JsonRpcRequestOptions {
  url: string;
  method: string;
  params?: unknown;
}

interface JsonRpcErrorPayload {
  code: number;
  message: string;
  data?: unknown;
}

interface JsonRpcResponse<T> {
  jsonrpc?: string;
  id?: JsonRpcId;
  result?: T;
  error?: JsonRpcErrorPayload;
}

interface StarknetGetEventsFilter {
  from_block?: GetEventsOptions["fromBlock"];
  to_block?: GetEventsOptions["toBlock"];
  address?: Felt | Felt[];
  keys?: Felt[][];
  chunk_size?: number;
  continuation_token?: string;
}

interface StarknetGetEventsResult {
  events: RpcEvent[];
  continuation_token?: string;
}

interface RpcContext {
  url: string;
  method: string;
}

interface TransportContext extends RpcContext {
  status?: number;
  statusText?: string;
  body?: string;
  cause?: unknown;
}

let nextJsonRpcId = 1;
const DEFAULT_GET_EVENTS_CHUNK_SIZE = 100;

export class StarknetRpcError extends Error {
  code: number;
  data?: unknown;
  method: string;
  url: string;

  constructor(error: JsonRpcErrorPayload, context: RpcContext) {
    super(
      `Starknet RPC error ${error.code} from ${context.method}: ${error.message}`,
    );
    this.name = "StarknetRpcError";
    this.code = error.code;
    this.data = error.data;
    this.method = context.method;
    this.url = context.url;
  }
}

export class StarknetTransportError extends Error {
  status?: number;
  statusText?: string;
  body?: string;
  cause?: unknown;
  method: string;
  url: string;

  constructor(message: string, context: TransportContext) {
    super(message);
    this.name = "StarknetTransportError";
    this.status = context.status;
    this.statusText = context.statusText;
    this.body = context.body;
    this.cause = context.cause;
    this.method = context.method;
    this.url = context.url;
  }
}

export function jsonRpc<T>(options: JsonRpcCallOptions): Promise<T>;
export function jsonRpc<T>(
  url: string,
  method: string,
  params?: unknown,
  options?: JsonRpcRequestOptions | AbortSignal,
): Promise<T>;
export async function jsonRpc<T>(
  urlOrOptions: string | JsonRpcCallOptions,
  methodArg?: string,
  paramsArg?: unknown,
  optionsArg: JsonRpcRequestOptions | AbortSignal = {},
): Promise<T> {
  const requestOptions = normalizeRequestOptions(optionsArg);
  const call =
    typeof urlOrOptions === "string"
      ? {
          ...requestOptions,
          url: urlOrOptions,
          method: methodArg,
          params: paramsArg,
        }
      : urlOrOptions;

  if (!call.method) {
    throw new TypeError("jsonRpc requires a method");
  }

  const context = { url: call.url, method: call.method };
  const request = {
    jsonrpc: "2.0",
    id: call.id ?? nextJsonRpcId++,
    method: call.method,
    ...(call.params !== undefined ? { params: call.params } : {}),
  };

  const requestSignal = createRequestAbortSignal(call.signal);
  let response: Response;
  let body: string;
  try {
    try {
      response = await fetch(call.url, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify(request),
        signal: requestSignal.signal,
      });
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }

      throw new StarknetTransportError(
        `Failed to send JSON-RPC request to ${call.url}`,
        {
          ...context,
          cause: error,
        },
      );
    }

    body = await response.text();
  } finally {
    requestSignal.cleanup();
  }

  const parsed = parseJsonRpcResponse<T>(body);

  if (!response.ok) {
    const rpcError = parsed ? normalizeRpcError(parsed.error) : undefined;
    if (rpcError) {
      throw new StarknetRpcError(rpcError, context);
    }

    throw new StarknetTransportError(
      `JSON-RPC request to ${call.url} failed with HTTP ${response.status}`,
      {
        ...context,
        status: response.status,
        statusText: response.statusText,
        body: bodySnippet(body),
      },
    );
  }

  if (!parsed) {
    throw new StarknetTransportError("Invalid JSON-RPC response", {
      ...context,
      body: bodySnippet(body),
    });
  }

  const rpcError = normalizeRpcError(parsed.error);
  if (rpcError) {
    throw new StarknetRpcError(rpcError, context);
  }

  if (!("result" in parsed)) {
    throw new StarknetTransportError("JSON-RPC response is missing result", {
      ...context,
      body: bodySnippet(body),
    });
  }

  return parsed.result as T;
}

export async function getEvents(
  options: GetEventsOptions,
): Promise<GetEventsPage> {
  const addresses = normalizeFelts(options.addresses);
  const keys = normalizeKeys(options.keys);
  const params = buildGetEventsParams(options, addresses, keys);

  const result = await jsonRpc<StarknetGetEventsResult>({
    url: options.url,
    method: "starknet_getEvents",
    params: [params],
    signal: options.signal,
  });

  if (!result || !Array.isArray(result.events)) {
    throw new StarknetTransportError("Invalid starknet_getEvents response", {
      url: options.url,
      method: "starknet_getEvents",
    });
  }

  const clientFilter: EventFilter = {
    addresses,
    keys,
  };
  const shouldFilterClientSide = Boolean(addresses || keys);
  const events = result.events
    .map((event) => normalizeEvent(event))
    .filter(
      (event) =>
        !shouldFilterClientSide || matchesEventFilter(event, clientFilter),
    );

  return {
    events,
    continuationToken: result.continuation_token,
  };
}

function buildGetEventsParams(
  options: GetEventsOptions,
  addresses: Felt[] | undefined,
  keys: Felt[][] | undefined,
): StarknetGetEventsFilter {
  const filter: StarknetGetEventsFilter = {};

  if (options.fromBlock !== undefined) {
    filter.from_block = options.fromBlock;
  }

  if (options.toBlock !== undefined) {
    filter.to_block = options.toBlock;
  }

  if (addresses !== undefined) {
    filter.address = addresses.length === 1 ? addresses[0] : addresses;
  }

  if (keys !== undefined) {
    filter.keys = keys;
  }

  filter.chunk_size = options.chunkSize ?? DEFAULT_GET_EVENTS_CHUNK_SIZE;

  if (options.continuationToken !== undefined) {
    filter.continuation_token = options.continuationToken;
  }

  return filter;
}

function normalizeFelts(values: Felt[] | undefined): Felt[] | undefined {
  if (!values || values.length === 0) {
    return undefined;
  }

  return values.map((value) => normalizeFelt(value));
}

function normalizeKeys(keys: Felt[][] | undefined): Felt[][] | undefined {
  if (!keys || keys.length === 0) {
    return undefined;
  }

  return keys.map((values) => values.map((value) => normalizeFelt(value)));
}

function parseJsonRpcResponse<T>(body: string): JsonRpcResponse<T> | undefined {
  if (body.trim() === "") {
    return undefined;
  }

  try {
    const parsed = JSON.parse(body) as unknown;
    if (!isRecord(parsed)) {
      return undefined;
    }

    return parsed as JsonRpcResponse<T>;
  } catch {
    return undefined;
  }
}

function normalizeRpcError(
  error: JsonRpcResponse<unknown>["error"],
): JsonRpcErrorPayload | undefined {
  if (error === undefined) {
    return undefined;
  }

  if (isRecord(error)) {
    return {
      code: typeof error.code === "number" ? error.code : -32000,
      message:
        typeof error.message === "string"
          ? error.message
          : "Unknown Starknet RPC error",
      data: error.data,
    };
  }

  return {
    code: -32000,
    message: "Unknown Starknet RPC error",
    data: error,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAbortError(error: unknown): boolean {
  return (
    isRecord(error) &&
    typeof error.name === "string" &&
    error.name === "AbortError"
  );
}

function normalizeRequestOptions(
  options: JsonRpcRequestOptions | AbortSignal,
): JsonRpcRequestOptions {
  if (isAbortSignal(options)) {
    return { signal: options };
  }

  return options;
}

function isAbortSignal(value: unknown): value is AbortSignal {
  return (
    isRecord(value) &&
    typeof value.aborted === "boolean" &&
    typeof value.addEventListener === "function"
  );
}

function createRequestAbortSignal(signal: AbortSignal | undefined): {
  signal?: AbortSignal;
  cleanup(): void;
} {
  if (!signal) {
    return { signal: undefined, cleanup() {} };
  }

  const controller = new AbortController();
  if (signal.aborted) {
    controller.abort(signal.reason);
    return { signal: controller.signal, cleanup() {} };
  }

  const abort = () => controller.abort(signal.reason);
  signal.addEventListener("abort", abort, { once: true });

  return {
    signal: controller.signal,
    cleanup() {
      signal.removeEventListener("abort", abort);
    },
  };
}

function bodySnippet(body: string): string | undefined {
  if (body.length === 0) {
    return undefined;
  }

  return body.length > 500 ? `${body.slice(0, 500)}...` : body;
}
