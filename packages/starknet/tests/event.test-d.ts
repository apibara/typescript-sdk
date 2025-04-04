import { describe, expectTypeOf, it } from "vitest";
import type { EventToPrimitiveType } from "../src/abi-wan-helpers";
import type { Event } from "../src/block";
import { decodeEvent } from "../src/event";
import { ekuboAbi } from "./fixtures/ekubo-abi";

describe("decodeEvent", () => {
  it("errors if the event does not exist", () => {
    const abi = ekuboAbi;

    const _decoded = decodeEvent({
      abi,
      // @ts-expect-error event does not exist
      eventName: "xxxx",
      event: {} as Event,
      strict: false,
    });
  });

  it("types the decoded event", () => {
    const abi = ekuboAbi;

    const decoded = decodeEvent({
      abi,
      eventName: "ekubo::core::Core::SavedBalance",
      event: {} as Event,
    });

    expectTypeOf(decoded.args).toEqualTypeOf<{
      key: { owner: `0x${string}`; token: `0x${string}`; salt: bigint };
      amount: bigint;
    }>();
  });

  it("types the root event", () => {
    const abi = ekuboAbi;

    const decoded = decodeEvent({
      abi,
      eventName: "ekubo::core::Core::Event",
      event: {} as Event,
    });

    expectTypeOf(decoded.args).toEqualTypeOf<
      EventToPrimitiveType<typeof ekuboAbi, "ekubo::core::Core::Event">
    >();
  });
});
