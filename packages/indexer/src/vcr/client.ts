import type {
  Client,
  ClientCallOptions,
  StatusRequest,
  StreamConfig,
  StreamDataOptions,
  StreamDataRequest,
  StreamDataResponse,
} from "@apibara/protocol";
import type { VcrConfig } from "./config";
import path from "node:path";
import fs from "node:fs";
import type { CassetteDataType } from "./record";
import assert from "node:assert";

export class VcrClient<TFilter, TBlock> implements Client<TFilter, TBlock> {
  constructor(
    private vcrConfig: VcrConfig,
    private cassetteName: string,
    private streamConfig: StreamConfig<TFilter, TBlock>,
  ) {}

  async status(request?: StatusRequest, options?: ClientCallOptions) {
    // TODO
    return {};
  }
  streamData(request: StreamDataRequest<TFilter>, options?: StreamDataOptions) {
    const filePath = path.join(
      this.vcrConfig.cassetteDir,
      `${this.cassetteName}.json`,
    );

    const data = fs.readFileSync(filePath, "utf8");
    const cassetteData: CassetteDataType<TFilter, TBlock> = deserialize(data);

    const { filter, messages } = cassetteData;
    assert.deepStrictEqual(
      filter,
      request.filter[0],
      Error("Request and Cassette filter mismatch"),
    );

    return new StreamDataIterable(messages);
  }
}

class StreamDataIterable<TBlock> {
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

function deserialize(str: string) {
  return JSON.parse(str, (_, value) =>
    typeof value === "string" && value.match(/^\d+n$/)
      ? BigInt(value.slice(0, -1))
      : value,
  );
}
