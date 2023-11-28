import { FieldElement } from "./felt";
import { EventFilter } from "./filter";
import { EventWithTransaction } from "./block";

import { type Abi, hash } from "starknet";

interface EventFilterParser {
  eventFilter(name: string): EventFilter;
  eventParser(name: string): ({ event, transaction }: EventWithTransaction ) => any;
}

// The Contract class implements the EventFilterParser interface.
export class Contract implements EventFilterParser {
  // Read-only properties for the contract's address and its ABI.
  readonly contractAddress: FieldElement;
  readonly contractAbi: Abi;

  // Constructor to initialize a Contract instance with a contract address and ABI.
  constructor(contractAddress: FieldElement, contractAbi: Abi) {
    this.contractAddress = contractAddress;
    this.contractAbi = contractAbi;
  }

  // Method to filter events based on their name from the contract's ABI.
  eventFilter(name: string): EventFilter {
    // Find the event in the ABI matching the provided name.
    const event: EventFilter = this.contractAbi.find((item) => item.name === name);
    
    // Throw an error if the event is not found in the ABI
    if (!event) {
      throw new Error(`Event ${name} not found in contract ABI`);
    }

    // Return the found event.
    return event;
  }

  // Method to parse events, given their name, and return a function that processes 
  // an event and its associated transaction.
  eventParser(name: string): ({ event, transaction }: EventWithTransaction ) => any {
    const event = this.eventFilter(name);

    // Need clarity on how to get a transaction from an event.

    return ({ transaction }: EventWithTransaction): any => {
      // Construct a new object combining the event details with the transaction.
      const newEvent: any = {
        event: event,
        transaction: transaction,
      };

      // Return the combined event and transaction object.
      return newEvent;
    };
  }
}
