import type { Abi } from "abi-wan-kanabi";
import type {
  AbiEventMember,
  ExtractAbiEvent,
  ExtractAbiEventNames,
  StringToPrimitiveType,
} from "abi-wan-kanabi/kanabi";

export type AbiEventStruct = {
  type: "event";
  name: string;
  kind: "struct";
  members: AbiEventMember[];
};

export type AbiMember = {
  name: string;
  type: string;
};

export type AbiEventEnum = {
  type: "event";
  name: string;
  kind: "enum";
  variants: AbiEventMember[];
};

export type AbiEvent = AbiEventStruct | AbiEventEnum;

export type AbiItem = Abi[number];

export type DecodeEventArgs<
  TAbi extends Abi = Abi,
  TEventName extends ExtractAbiEventNames<TAbi> = ExtractAbiEventNames<TAbi>,
  TStrict extends boolean = true,
> = {
  abi: TAbi;
  eventName: TEventName;
  event: Event;
  strict?: TStrict;
};

export type DecodedEvent<
  TAbi extends Abi = Abi,
  TEventName extends ExtractAbiEventNames<TAbi> = ExtractAbiEventNames<TAbi>,
> = Event & {
  eventName: TEventName;
  args: EventToPrimitiveType<TAbi, TEventName>;
};

export type DecodeEventReturn<
  TAbi extends Abi = Abi,
  TEventName extends ExtractAbiEventNames<TAbi> = ExtractAbiEventNames<TAbi>,
  TStrict extends boolean = true,
> = TStrict extends true
  ? DecodedEvent<TAbi, TEventName>
  : DecodedEvent<TAbi, TEventName> | null;

// Helper type to resolve the payload type of a nested variant.
// when the type name corresponds to an event; resolves it using EventToPrimitiveType,
export type ResolveNestedVariantType<
  TAbi extends Abi,
  TTypeName extends string,
> = EventToPrimitiveType<TAbi, TTypeName>; // resolve its structure recursively

// Helper type to convert a variant member (nested or flat) into its corresponding tagged union part(s).
export type VariantToTaggedUnion<
  TAbi extends Abi,
  TVariant extends AbiEventMember,
> = TVariant extends { kind: "nested" }
  ? // Nested: Use the helper to resolve the payload type.
    { _tag: TVariant["name"] } & {
      [K in TVariant["name"]]: ResolveNestedVariantType<TAbi, TVariant["type"]>;
    }
  : TVariant extends { kind: "flat" }
    ? // Flat: Recursively call EventToPrimitiveType on the referenced event type.
      // This will return the union of tagged types for the nested event.
      EventToPrimitiveType<TAbi, TVariant["type"]>
    : never; // Should not happen for valid ABIs

// Main type to convert an event definition (struct or enum) to its TS representation.
export type EventToPrimitiveType<
  TAbi extends Abi,
  TEventName extends ExtractAbiEventNames<TAbi>,
> = ExtractAbiEvent<TAbi, TEventName> extends infer TEventDef
  ? TEventDef extends {
      type: "event";
      kind: "struct";
      members: infer TMembers extends readonly AbiEventMember[];
    }
    ? // Struct Event: A simple object with member names as keys and their primitive types as values.
      {
        [Member in TMembers[number] as Member["name"]]: StringToPrimitiveType<
          TAbi,
          Member["type"]
        >;
      }
    : TEventDef extends {
          type: "event";
          kind: "enum";
          variants: infer TVariants extends readonly AbiEventMember[];
        }
      ? // Enum Event: Create a union of all possible tagged types derived from its variants.
        {
          // Map each variant to its corresponding tagged union structure(s).
          [Idx in keyof TVariants]: VariantToTaggedUnion<TAbi, TVariants[Idx]>;
        }[number] // Indexing with [number] converts the tuple of union parts into a single union type.
      : // Explicitly handle empty enum events to ensure the `extends never` check works reliably.
        TEventDef extends { type: "event"; kind: "enum"; variants: [] }
        ? never
        : // Not an event definition found for TEventName -> never
          never
  : // If the event name is not found in the ABI, return never.
    never;

export function isEventAbi(item: AbiItem): item is AbiEvent {
  return item.type === "event";
}

export function isStructEventAbi(item: AbiItem): item is AbiEventStruct {
  return isEventAbi(item) && item.kind === "struct";
}

export function isEnumEventAbi(item: AbiItem): item is AbiEventEnum {
  return isEventAbi(item) && item.kind === "enum";
}
