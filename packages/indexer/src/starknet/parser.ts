import { FieldElement } from "./felt";
import { EventFilter } from "./filter";

import { type Abi, EventAbi, hash } from "starknet";

/** Build a stream filter from a contract ABI. */
export class Contract {
  // Read-only properties for the contract's address and its ABI.
  readonly contractAddress: FieldElement;
  readonly contractAbi: Abi;

  constructor(contractAddress: FieldElement, contractAbi: Abi) {
    this.contractAddress = contractAddress;
    this.contractAbi = contractAbi;
  }

  private _findEvent(name: string): EventAbi | undefined {
    // Find the event in the ABI matching the provided name.
    const event: EventAbi | undefined = this.contractAbi.find(
      (item) => item.type === "event" && item.name === name,
    );

    return event;
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
      fromAddress: this.contractAddress,
      keys: [hash.getSelectorFromName(event.name) as `0x${string}`],
      includeTransaction: opts.includeTransaction ?? false,
      includeReceipt: opts.includeReceipt ?? false,
      includeReverted: opts.includeReverted ?? false,
    };
  }
}
