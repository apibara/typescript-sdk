import { Schema } from "@effect/schema";
import { test } from "vitest";

import { Data } from "./stream";

const Inner = Schema.Struct({
  data: Schema.String,
});

const Good = Schema.transform(Schema.Uint8ArrayFromSelf, Schema.NullOr(Inner), {
  decode(value) {
    throw new Error("not implemented");
  },
  encode(value) {
    throw new Error("not implemented");
  },
});

const Bad = Schema.transform(Schema.Uint8ArrayFromSelf, Inner, {
  decode(value) {
    throw new Error("not implemented");
  },
  encode(value) {
    throw new Error("not implemented");
  },
});

test("Data", () => {
  const GoodData = Data(Good);

  // @ts-expect-error
  const BadData = Data(Bad);
});
