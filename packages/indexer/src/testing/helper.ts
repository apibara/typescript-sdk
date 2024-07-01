import type { MockStreamResponse } from "@apibara/protocol/testing";

export function generateMockMessages(count = 10): MockStreamResponse[] {
  return [...Array(count)].map((_, i) => ({
    _tag: "data",
    data: {
      finality: "accepted",
      data: [{ data: `${5_000_000 + i}` }],
      endCursor: { orderKey: BigInt(5_000_000 + i) },
    },
  }));
}
