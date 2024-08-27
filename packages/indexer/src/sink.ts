export type SinkData = Record<string, unknown>;

export abstract class Sink<TTxnParams = unknown> {
  abstract transaction(
    cb: (params: TTxnParams) => Promise<void>,
  ): Promise<void>;
}

export class DefaultSink extends Sink<unknown> {
  async transaction(cb: (params: unknown) => Promise<void>): Promise<void> {
    await cb({});
  }
}

export function defaultSink() {
  return new DefaultSink();
}
