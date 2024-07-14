import type { Client, ClientCallOptions, StreamDataOptions } from "../client";
import type { StatusRequest, StatusResponse } from "../status";
import type { StreamDataRequest, StreamDataResponse } from "../stream";

export class MockClient<TFilter, TBlock> implements Client<TFilter, TBlock> {
  constructor(
    private messageFactory: (
      request: StreamDataRequest<TFilter>,
      options?: StreamDataOptions,
    ) => (StreamDataResponse<TBlock> | Error)[],
  ) {}

  async status(
    request?: StatusRequest,
    options?: ClientCallOptions,
  ): Promise<StatusResponse> {
    throw new Error("Client.status is not implemented for VcrClient");
  }

  streamData(request: StreamDataRequest<TFilter>, options?: StreamDataOptions) {
    const messages = this.messageFactory(request, options);

    return new StreamDataIterable(messages);
  }
}

export class StreamDataIterable<TBlock> {
  constructor(private messages: (StreamDataResponse<TBlock> | Error)[]) {}

  [Symbol.asyncIterator](): AsyncIterator<StreamDataResponse<TBlock>> {
    let index = 0;
    const messages = this.messages;

    return {
      async next() {
        if (index >= messages.length) {
          return { done: true, value: undefined };
        }

        const message = messages[index++];
        if (message instanceof Error) {
          throw message;
        }

        return { done: false, value: message };
      },
    };
  }
}
