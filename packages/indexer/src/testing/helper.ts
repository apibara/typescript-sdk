import type { StreamDataResponse } from "@apibara/protocol";
import type { MockBlock } from "@apibara/protocol/testing";

export function generateMockMessages(
  count = 10,
): StreamDataResponse<MockBlock>[] {
  return [...Array(count)].map((_, i) => ({
    _tag: "data",
    data: {
      finality: "accepted",
      data: [{ blockNumber: BigInt(5_000_000 + i) }],
      endCursor: { orderKey: BigInt(5_000_000 + i) },
    },
  }));
}
