import type { Cursor } from "@apibara/protocol";
import { Sink, type SinkData } from "../sink";
import type { VcrReplayResult } from "../vcr";

type TxnContext = {
  buffer: SinkData[];
  endCursor?: Cursor;
};

type TxnParams = {
  writer: (endCursor?: Cursor | undefined) => {
    insert: (data: SinkData[]) => void;
  };
};

const transactionHelper = (context: TxnContext) => (endCursor?: Cursor) => {
  return {
    insert: (data: SinkData[]) => {
      context.buffer.push(...data);
      context.endCursor = endCursor;
    },
  };
};

export class VcrSink extends Sink {
  public result: VcrReplayResult["outputs"] = [];

  write({ data, endCursor }: { data: SinkData[]; endCursor?: Cursor }) {
    if (data.length === 0) return;

    this.result.push({ data, endCursor });
  }

  async transaction(cb: (params: TxnParams) => Promise<void>) {
    const context: TxnContext = {
      buffer: [],
      endCursor: undefined,
    };

    const writer = transactionHelper(context);

    await cb({ writer });
    this.write({ data: context.buffer, endCursor: context.endCursor });
  }
}

export function vcr() {
  return new VcrSink();
}
