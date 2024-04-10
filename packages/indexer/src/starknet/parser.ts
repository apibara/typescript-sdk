import type { Abi, EventAbi } from "starknet";

import { type FieldElement, getSelector } from "./felt";
import type { EventFilter } from "./filter";

/** Build a stream filter from a contract ABI. */
export class Contract {
  // Read-only properties for the contract's address and its ABI.
  readonly address: FieldElement;
  readonly abi: Abi;

  private selectorToEvent: Record<FieldElement, string>;

  constructor(contractAddress: FieldElement, contractAbi: Abi) {
    this.address = contractAddress;
    this.abi = contractAbi;
    this.selectorToEvent = {};
    this._populateSelectorToEvent();
  }

  private _findEvent(name: string): EventAbi | undefined {
    // Find the event in the ABI matching the provided name.
    const event: EventAbi | undefined = this.abi.find(
      (item) => item.type === "event" && item.name === name,
    );

    return event;
  }

  private _populateSelectorToEvent(): void {
    this.selectorToEvent = {};
    for (const event of this.abi) {
      if (event.type !== "event") {
        continue;
      }
      this.selectorToEvent[getSelector(event.name)] = event.name;
    }
  }

  /** Filter events based on their name from the contract's ABI. */
  eventFilter(
    name: string,
    opts: Pick<
      EventFilter,
      "includeReceipt" | "includeTransaction" | "includeReverted"
    > = {},
  ): EventFilter {
    const event = this._findEvent(name);

    // Throw an error if the event is not found in the ABI
    if (!event) {
      throw new Error(`Event ${name} not found in contract ABI`);
    }

    // Return the found event.
    return {
      fromAddress: this.address,
      keys: [getSelector(event.name)],
      includeTransaction: opts.includeTransaction ?? false,
      includeReceipt: opts.includeReceipt ?? false,
      includeReverted: opts.includeReverted ?? false,
    };
  }

  /** Returns the event name based on its selector. */
  lookupEventFromSelector(selector: FieldElement): string | undefined {
    return this.selectorToEvent[selector];
  }
}
