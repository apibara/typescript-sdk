import { type Abi, CallData } from "starknet";
import type {
  ExtractAbiEventNames,
  ExtractAbiEvent,
  EventToPrimitiveType,
  AbiEventMember,
} from "abi-wan-kanabi/kanabi";

import { FieldElement, getSelector } from "./felt";
import { EventFilter } from "./filter";
import { Event } from "./block";

type AbiEventStruct = {
  type: "event";
  name: string;
  kind: "struct";
  members: readonly AbiEventMember[];
};

type AbiEventEnum = {
  type: "event";
  name: string;
  kind: "enum";
  variants: readonly AbiEventMember[];
};

type AbiEvent = AbiEventStruct | AbiEventEnum;

function isAbiEvent(item: any): item is AbiEvent {
  return item.type === "event";
}

export type DecodedEventReturnType<
  TAbi extends Abi,
  TEventName extends ExtractAbiEventNames<TAbi>,
> = {
  [Name in TEventName]: {
    name: Name;
    raw: Event;
    decoded: EventToPrimitiveType<TAbi, Name> extends infer Args ? Args : never;
  };
}[TEventName];

export type EventFilterArgs<
  TAbi extends Abi,
  TEventName extends ExtractAbiEventNames<TAbi>,
> = ExtractAbiEvent<TAbi, TEventName> extends {
  type: "event";
  kind: "struct";
}
  ? { name: TEventName; variant?: never }
  : ExtractAbiEvent<TAbi, TEventName> extends {
        type: "event";
        kind: "enum";
        variants: infer TVariants extends readonly AbiEventMember[];
      }
    ? {
        name: TEventName;
        variant: string extends TVariants[number]["name"]
          ? never
          : TVariants[number]["name"];
      }
    : never;

/** Build a stream filter from a contract ABI. */
export class Contract<TAbi extends Abi> {
  readonly address?: FieldElement;
  readonly abi: TAbi;

  private calldata: CallData;

  constructor({ address, abi }: { address?: FieldElement; abi: TAbi }) {
    this.address = address;
    this.abi = abi;
    this.calldata = new CallData(this.abi);
  }

  private _findEvent(name: string): AbiEvent | undefined {
    return this.abi.find((item) => item.name === name && item.type === "event");
  }

  private _eventSelector<TEventName extends ExtractAbiEventNames<TAbi>>({
    name,
    variant,
  }: EventFilterArgs<TAbi, TEventName>): FieldElement {
    const event = this._findEvent(name);

    if (!event) {
      throw new Error(`Event ${name} not found in contract ABI`);
    }

    if (event.kind === "enum") {
      if (variant === undefined) {
        throw new Error(
          `Event ${name} is an enum, but no variant was provided`,
        );
      }

      const v = event.variants.find((v) => v.name === variant);
      if (v === undefined) {
        throw new Error(`Event ${name} has no variant ${variant}`);
      }

      return getSelector(v.name);
    }

    return getSelector(event.name);
  }

  private _findEventNameBySelector(selector: FieldElement): string | undefined {
    return this.abi.find((item) => {
      if (!isAbiEvent(item)) {
        return false;
      }

      if (item.kind === "enum") {
        return item.variants.some((v) => getSelector(v.name) === selector);
      }

      return getSelector(item.name) === selector;
    })?.name;
  }

  /** Filter events based on their name from the contract's ABI. */
  eventFilter<TEventName extends ExtractAbiEventNames<TAbi>>(
    args: EventFilterArgs<TAbi, TEventName>,
    opts: Pick<
      EventFilter,
      "includeReceipt" | "includeTransaction" | "includeReverted"
    > & { address?: string | null } = {},
  ): EventFilter {
    const selector = this._eventSelector(args);

    const fromAddress =
      opts.address === undefined ? this.address : opts.address;

    return {
      fromAddress: fromAddress ? FieldElement.parse(fromAddress) : undefined,
      keys: [selector],
      includeTransaction: opts.includeTransaction ?? false,
      includeReceipt: opts.includeReceipt ?? false,
      includeReverted: opts.includeReverted ?? false,
    };
  }

  /** Returns the event name based on its selector. */
  lookupEventFromSelector<TEventName extends ExtractAbiEventNames<TAbi>>(
    selector: FieldElement,
  ): TEventName | undefined {
    return this._findEventNameBySelector(selector) as TEventName | undefined;
  }
}
