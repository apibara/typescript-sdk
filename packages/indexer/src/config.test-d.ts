import { assertType, describe, test } from "vitest";

import { Config } from "./config";

describe("Config", () => {
  test("without any network or sink type", () => {
    assertType<Config>({
      network: "test-network",
      filter: {},
      sinkType: "test-sink",
      sinkOptions: {},
    });
  });

  test("with restrictions on network and sink", () => {
    type Network = {
      network: "test-network";
      filter: { a: number };
    };

    type Sink = {
      sinkType: "test-sink";
      sinkOptions: {
        b: string;
      };
    };

    assertType<Config<Network, Sink>>({
      network: "test-network",
      filter: {
        a: 1,
      },
      sinkType: "test-sink",
      sinkOptions: {
        b: "test",
      },
    });
  });

  test("network options are required", () => {
    // @ts-expect-error - missing network options
    assertType<Config>({
      sinkType: "test-sink",
      sinkOptions: {},
    });
  });

  test("sink options are required", () => {
    // @ts-expect-error - missing sink options
    assertType<Config>({
      network: "test-network",
      filter: {},
    });
  });
});
