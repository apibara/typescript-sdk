import { bench, describe } from "vitest";
import * as proto from "../src/proto";

import { BlockFromBytes } from "../src/block";
import { emptyBlock, largeBlockNew, largeEventsBlock } from "./fixtures";

const codecDecoder = BlockFromBytes.decode;
const protobufDecoder = proto.data.Block.decode;

describe("empty block", () => {
  bench("decode with codec", () => {
    codecDecoder(emptyBlock);
  });

  bench("decode with protobuf", () => {
    protobufDecoder(emptyBlock);
  });
});

describe("large block", () => {
  bench("decode with codec", () => {
    codecDecoder(largeBlockNew);
  });

  bench("decode with protobuf", () => {
    protobufDecoder(largeBlockNew);
  });
});

describe("large block - accessing one field", () => {
  bench("decode with codec", () => {
    const block = codecDecoder(largeBlockNew);

    if (block?.events) {
      for (const event of block.events) {
        const { address } = event;
      }
    }
  });

  bench("decode with protobuf", () => {
    const block = protobufDecoder(largeBlockNew);

    if (block?.events) {
      for (const event of block.events) {
        const { address } = event;
      }
    }
  });
});

describe("large block - accessing all fields", () => {
  bench("decode with codec", () => {
    const block = codecDecoder(largeBlockNew);

    if (block?.events) {
      for (const event of block.events) {
        const {
          address,
          data,
          eventIndex,
          eventIndexInTransaction,
          filterIds,
          keys,
          transactionHash,
          transactionIndex,
          transactionStatus,
        } = event;
      }
    }
  });

  bench("decode with protobuf", () => {
    const block = protobufDecoder(largeBlockNew);

    if (block?.events) {
      for (const event of block.events) {
        const {
          address,
          data,
          eventIndex,
          eventIndexInTransaction,
          filterIds,
          keys,
          transactionHash,
          transactionIndex,
          transactionStatus,
        } = event;
      }
    }
  });
});

describe("large events block", () => {
  bench("decode with codec", () => {
    codecDecoder(largeEventsBlock);
  });

  bench("decode with protobuf", () => {
    protobufDecoder(largeEventsBlock);
  });
});

describe("large events block - accessing one field", () => {
  bench("decode with codec", () => {
    const block = codecDecoder(largeEventsBlock);

    if (block?.events) {
      for (const event of block.events) {
        const { address } = event;
      }
    }
  });

  bench("decode with protobuf", () => {
    const block = protobufDecoder(largeEventsBlock);

    if (block?.events) {
      for (const event of block.events) {
        const { address } = event;
      }
    }
  });
});

describe("large events block - accessing all fields", () => {
  bench("decode with codec", () => {
    const block = codecDecoder(largeEventsBlock);

    if (block?.events) {
      for (const event of block.events) {
        const {
          address,
          data,
          eventIndex,
          eventIndexInTransaction,
          filterIds,
          keys,
          transactionHash,
          transactionIndex,
          transactionStatus,
        } = event;
      }
    }
  });

  bench("decode with protobuf", () => {
    const block = protobufDecoder(largeEventsBlock);

    if (block?.events) {
      for (const event of block.events) {
        const {
          address,
          data,
          eventIndex,
          eventIndexInTransaction,
          filterIds,
          keys,
          transactionHash,
          transactionIndex,
          transactionStatus,
        } = event;
      }
    }
  });
});
