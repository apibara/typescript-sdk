import { Contract } from "./parser";
import { describe, expect, it } from "vitest";
import type { FieldElement } from "./felt";
import { EventAbi } from "starknet";

describe("Contract", () => {
  const mockContractAddress: FieldElement = "0x0";

  const mockContractAbi = [
    {
      type: "event",
      name: "MockEvent",
      kind: "struct",
      members: [{ name: "param1", type: "felt", kind: "key" }],
    },
    {
      type: "event",
      name: "AnotherEvent",
      kind: "struct",
      members: [{ name: "param1", type: "felt", kind: "key" }],
    },
  ];

  it("should create an EventFilter for a valid event name", () => {
    const contract = new Contract(mockContractAddress, mockContractAbi);
    const filter = contract.eventFilter("MockEvent");

    expect(filter).toBeDefined();
    expect(filter.fromAddress).toBe(mockContractAddress);
    expect(filter.includeReceipt).toBeFalsy();
  });

  it("overrides some arguments", () => {
    const contract = new Contract(mockContractAddress, mockContractAbi);
    const filter = contract.eventFilter("MockEvent", { includeReceipt: true });

    expect(filter).toBeDefined();
    expect(filter.includeReceipt).toBeTruthy();
  });

  it("can lookup an event name by its selector", () => {
    const contract = new Contract(mockContractAddress, mockContractAbi);
    const filter = contract.eventFilter("AnotherEvent");
    const eventName = contract.lookupEventFromSelector(
      filter.keys?.[0] ?? "0x00",
    );

    expect(eventName).toEqual("AnotherEvent");
  });

  it("returns undefined if no event matches", () => {
    const contract = new Contract(mockContractAddress, mockContractAbi);
    const eventName = contract.lookupEventFromSelector(
      "0x1234567890123456789012345678901234567890123456789012345678901234",
    );

    expect(eventName).toBeUndefined();
  });

  it("should throw an error for an invalid event name", () => {
    const contract = new Contract(mockContractAddress, mockContractAbi);

    expect(() => {
      contract.eventFilter("InvalidEvent");
    }).toThrow("Event InvalidEvent not found in contract ABI");
  });
});
