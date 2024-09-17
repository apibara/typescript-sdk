import type { Cursor } from "@apibara/protocol";
import { Sink, type SinkCursorParams, type SinkData } from "../sink";
import type { VcrReplayResult } from "../vcr";

type TxnContext = {
  buffer: SinkData[];
};

type TxnParams = {
  writer: {
    insert: (data: SinkData[]) => void;
  };
};

const transactionHelper = (context: TxnContext) => {
  return {
    insert: (data: SinkData[]) => {
      context.buffer.push(...data);
    },
  };
};

export class VcrSink extends Sink {
  public result: VcrReplayResult["outputs"] = [];

  write({ data, endCursor }: { data: SinkData[]; endCursor?: Cursor }) {
    if (data.length === 0) return;

    this.result.push({ data, endCursor });
  }

  async transaction(
    { cursor, endCursor, finality }: SinkCursorParams,
    cb: (params: TxnParams) => Promise<void>,
  ) {
    const context: TxnContext = {
      buffer: [],
    };

    const writer = transactionHelper(context);

    await cb({ writer });
    this.write({ data: context.buffer, endCursor });
  }

  async invalidate(cursor?: Cursor) {
    // TODO: Implement
    throw new Error("Not implemented");
  }
}

export function vcr() {
  return new VcrSink();
}
