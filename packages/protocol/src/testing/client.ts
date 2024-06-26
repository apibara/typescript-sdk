import assert from "node:assert";

import type { Client, ClientCallOptions, StreamDataOptions } from "../client";
import type { StatusRequest, StatusResponse } from "../status";
import type { StreamDataRequest, StreamDataResponse } from "../stream";

export class MockClient<TFilter, TBlock> implements Client<TFilter, TBlock> {
  constructor(
    private messages: StreamDataResponse<TBlock>[],
    private filter: TFilter[],
  ) {}

  async status(
    request?: StatusRequest,
    options?: ClientCallOptions,
  ): Promise<StatusResponse> {
    throw new Error("Client.status is not implemented for VcrClient");
  }

  streamData(request: StreamDataRequest<TFilter>, options?: StreamDataOptions) {
    assert.deepStrictEqual(
      this.filter,
      request.filter,
      "Request and Cassette filter mismatch",
    );

    return new StreamDataIterable(this.messages);
  }
}

export class StreamDataIterable<TBlock> {
  constructor(private messages: StreamDataResponse<TBlock>[]) {}

  [Symbol.asyncIterator](): AsyncIterator<StreamDataResponse<TBlock>> {
    let index = 0;
    const messages = this.messages;

    return {
      async next() {
        if (index >= messages.length) {
          return { done: true, value: undefined };
        }

        const message = messages[index++];
        return { done: false, value: message };
      },
    };
  }
}
