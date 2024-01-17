import { describe, expect, test } from "vitest";

import { FieldElement } from "./felt";

describe("FieldElement", () => {
  test("parse address", () => {
    const output = FieldElement.parse(
      "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    );
    expect(output).toEqual(
      "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    );
  });

  test("parse value", () => {
    const output = FieldElement.parse("0x1");
    expect(output).toEqual(
      "0x0000000000000000000000000000000000000000000000000000000000000001",
    );
  });

  test("parse invalid value", () => {
    expect(() => FieldElement.parse("0x")).toThrowError();
  });
});
