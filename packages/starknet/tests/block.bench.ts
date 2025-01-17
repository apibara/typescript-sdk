import { Schema } from "@effect/schema";
import { bench, describe } from "vitest";

import { BlockFromBytes } from "../src/block";
import * as proto from "../src/proto";

import { emptyBlock, largeBlock } from "./fixtures";

const decode = Schema.decodeSync(BlockFromBytes);

describe("BlockFromBytes - empty block", () => {
  bench("decode", () => {
    decode(emptyBlock);
  });
});

describe("BlockFromBytes - large block", () => {
  bench("decode", () => {
    decode(largeBlock);
  });

  bench("protobuf", () => {
    proto.data.Block.decode(largeBlock);
  });
});
