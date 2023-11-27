import { FieldElement } from "./felt";

interface EventFilterParser {
  eventFilter(name: string): Filter;
  // eventParser(name: string): ParsedEvent[];
}

interface Filter {
  name: string;
}

interface Event {
  // Parsed event properties
  event: any;
  transaction: any;
}

export class Contract implements EventFilterParser {
  readonly contractAddress: FieldElement;
  readonly contractAbi: any[];

  constructor(contractAddress: FieldElement, contractAbi: any[]) {
    this.contractAddress = contractAddress;
    this.contractAbi = contractAbi;
  }

  eventFilter(name: string): Filter {
    // Check if event exists in ABI
    const event = this.contractAbi.find((item) => item.name === name);
    if (!event) {
      throw new Error(`Event ${name} not found in contract ABI`);
    }

    // Need more clarity on what the DNA filter should look like
    // Also clarity on the Pedersen hash

    return event;
  }

  eventParser(name: string): ({ event, transaction }: Event) => Event {
    return ({ event, transaction }: Event): Event => {
      const newEvent: Event = {
        event: "Bead Test",
        transaction: "yoooo!!!",
      };

      return newEvent;
    };
  }
}
