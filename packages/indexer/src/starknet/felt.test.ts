import { describe, expect, test } from "vitest";

import { FieldElement } from "./felt";

describe("FieldElement", () => {
  test("parse address", () => {
    FieldElement.parse(
      "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    );
  });

  test("parse value", () => {
    FieldElement.parse("0x1");
  });

  test("parse invalid value", () => {
    expect(() => FieldElement.parse("0x")).toThrowError();
  });
});
