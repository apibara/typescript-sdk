import { assertType, describe, test } from "vitest";

import { Console } from "./console";

describe("Console", () => {
  test("accepts any option", () => {
    assertType<Console>({
      sinkType: "console",
      sinkOptions: {
        hello: "world",
      },
    });
  });
});
