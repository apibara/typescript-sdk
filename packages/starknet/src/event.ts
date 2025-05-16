import type { Abi } from "abi-wan-kanabi";
import type {
  AbiEventMember,
  ExtractAbiEventNames,
} from "abi-wan-kanabi/kanabi";
import {
  PrimitiveTypeParsers,
  getArrayElementType,
  getEventSelector,
  getOptionType,
  getSpanType,
  isArrayType,
  isByteArray,
  isEmptyType,
  isOptionType,
  isPrimitiveType,
  isSpanType,
} from "./abi";
import {
  type AbiEvent,
  type AbiEventEnum,
  type AbiEventStruct,
  type AbiMember,
  type EventToPrimitiveType,
  isEnumEventAbi,
  isEventAbi,
  isStructEventAbi,
} from "./abi-wan-helpers";
import type { Event } from "./block";
import {
  ParseError,
  type Parser,
  parseArray,
  parseByteArray,
  parseEmpty,
  parseOption,
  parseSpan,
  parseStruct,
} from "./parser";

export class DecodeEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecodeEventError";
  }
}

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

/** Decodes a single event.
 *
 * If `strict: true`, this function throws on failure. Otherwise, returns null.
 */
export function decodeEvent<
  TAbi extends Abi = Abi,
  TEventName extends ExtractAbiEventNames<TAbi> = ExtractAbiEventNames<TAbi>,
  TStrict extends boolean = true,
>(
  args: DecodeEventArgs<TAbi, TEventName, TStrict>,
): DecodeEventReturn<TAbi, TEventName, TStrict> {
  const { abi, event, eventName, strict = true } = args;

  const eventAbi = abi.find(
    (item) => item.name === eventName && item.type === "event",
  );

  if (!eventAbi || !isEventAbi(eventAbi)) {
    if (strict) {
      throw new DecodeEventError(`Event ${eventName} not found in ABI`);
    }
    return null as DecodeEventReturn<TAbi, TEventName, TStrict>;
  }

  try {
    if (isStructEventAbi(eventAbi)) {
      return decodeStructEvent(abi, eventAbi, event, eventName);
    }

    if (isEnumEventAbi(eventAbi)) {
      return decodeEnumEvent(abi, eventAbi, event, eventName);
    }

    throw new DecodeEventError(
      `Unsupported event kind: ${(eventAbi as AbiEvent)?.kind}`,
    );
  } catch (error) {
    if (
      (error instanceof DecodeEventError || error instanceof ParseError) &&
      !strict
    ) {
      return null as DecodeEventReturn<TAbi, TEventName, TStrict>;
    }

    throw error;
  }
}

function decodeStructEvent<
  TAbi extends Abi = Abi,
  TEventName extends ExtractAbiEventNames<TAbi> = ExtractAbiEventNames<TAbi>,
>(
  abi: TAbi,
  eventAbi: AbiEventStruct,
  event: Event,
  eventName: TEventName,
): DecodedEvent<TAbi, TEventName> {
  const selector = BigInt(getEventSelector(eventName));
  if ((event.keys && selector !== BigInt(event.keys[0])) || !event.keys) {
    throw new DecodeEventError(
      `Selector mismatch. Expected ${selector}, got ${event.keys?.[0]}`,
    );
  }

  const keysAbi = eventAbi.members.filter((m) => m.kind === "key");
  const dataAbi = eventAbi.members.filter((m) => m.kind === "data");

  const keysParser = compileEventMembers(abi, keysAbi);
  const dataParser = compileEventMembers(abi, dataAbi);

  const keysWithoutSelector = event.keys?.slice(1) ?? [];

  const { out: decodedKeys } = keysParser(keysWithoutSelector, 0);
  const { out: decodedData } = dataParser(event.data ?? [], 0);

  const decoded = {
    ...decodedKeys,
    ...decodedData,
  } as EventToPrimitiveType<TAbi, TEventName>;

  return {
    ...event,
    eventName,
    args: decoded,
  } as DecodedEvent<TAbi, TEventName>;
}

function decodeEnumEvent<
  TAbi extends Abi = Abi,
  TEventName extends ExtractAbiEventNames<TAbi> = ExtractAbiEventNames<TAbi>,
>(
  abi: TAbi,
  eventAbi: AbiEventEnum,
  event: Event,
  eventName: TEventName,
): DecodedEvent<TAbi, TEventName> {
  if (!event.keys || event.keys.length === 0) {
    throw new DecodeEventError(
      "Event has no keys; cannot determine variant selector",
    );
  }

  const variants = eventAbi.variants;

  const variantSelector = event.keys[0];

  // Create a map of all possible selectors to their variant paths
  const selectorToVariant = buildVariantSelectorMap(abi, variants);

  // Find the matching variant and path
  const matchingVariant = selectorToVariant[variantSelector];

  if (!matchingVariant) {
    throw new DecodeEventError(
      `No matching variant found for selector: ${variantSelector}`,
    );
  }

  const structEventAbi = abi.find(
    (item) =>
      item.name === matchingVariant.variant.type && item.type === "event",
  );

  if (!structEventAbi || !isStructEventAbi(structEventAbi)) {
    throw new DecodeEventError(
      `Nested event type not found or not a struct: ${matchingVariant.variant.type}`,
    );
  }

  const decodedStruct = decodeStructEvent(
    abi,
    structEventAbi,
    event,
    matchingVariant.variant.name,
  );

  return {
    ...event,
    eventName,
    args: {
      _tag: matchingVariant.variant.name,
      [matchingVariant.variant.name]: decodedStruct.args,
    },
  } as DecodedEvent<TAbi, TEventName>;
}

type EnumFlatVariantMap = Record<
  string,
  { variant: AbiEventMember; path: string[] }
>;

// Helper to build a map of all possible selectors to their variant paths
function buildVariantSelectorMap(
  abi: Abi,
  variants: AbiEventMember[],
): EnumFlatVariantMap {
  const selectorMap: EnumFlatVariantMap = {};

  for (const variant of variants) {
    // For nested events, just map the variant's own selector
    if (variant.kind === "nested") {
      const selector = getEventSelector(variant.name);
      selectorMap[selector] = { variant, path: [variant.name] };
    }
    // For flat events, recursively map all possible selectors from the event hierarchy
    else if (variant.kind === "flat") {
      const flatEventName = variant.type;
      const flatEventAbi = abi.find(
        (item) => item.name === flatEventName && item.type === "event",
      );

      // Skip if the flat event type is not found
      if (!flatEventAbi) {
        continue;
      }

      if (isEnumEventAbi(flatEventAbi)) {
        // For enum events, recursively map all their variants
        const nestedMap = buildVariantSelectorMap(abi, flatEventAbi.variants);

        // Add this variant to the path for all nested selectors
        for (const [
          nestedSelector,
          { variant: nestedVariant, path: nestedPath },
        ] of Object.entries(nestedMap)) {
          selectorMap[nestedSelector] = {
            variant: nestedVariant,
            path: [variant.name, ...nestedPath],
          };
        }
      }
    }
  }

  return selectorMap;
}

function compileEventMembers<T extends Record<string, unknown>>(
  abi: Abi,
  members: AbiEventMember[],
): Parser<T> {
  return compileStructParser(abi, members) as Parser<T>;
}

function compileTypeParser(abi: Abi, type: string): Parser<unknown> {
  if (isPrimitiveType(type)) {
    return PrimitiveTypeParsers[type as keyof typeof PrimitiveTypeParsers];
  }

  if (isArrayType(type)) {
    const elementType = getArrayElementType(type);
    return parseArray(compileTypeParser(abi, elementType));
  }

  if (isSpanType(type)) {
    const elementType = getSpanType(type);
    return parseSpan(compileTypeParser(abi, elementType));
  }

  if (isOptionType(type)) {
    const elementType = getOptionType(type);
    return parseOption(compileTypeParser(abi, elementType));
  }

  if (isEmptyType(type)) {
    return parseEmpty;
  }

  if (isByteArray(type)) {
    return parseByteArray;
  }

  // Not a well-known type. Look it up in the ABI.
  const typeAbi = abi.find((item) => item.name === type);
  if (!typeAbi) {
    throw new DecodeEventError(`Type ${type} not found in ABI`);
  }

  switch (typeAbi.type) {
    case "struct": {
      return compileStructParser(abi, typeAbi.members);
    }
    case "enum": {
      // This should never happen anyways as compileTypeParser is only called
      // primitive types or to compile structs parsers.
      throw new DecodeEventError(`Enum types are not supported: ${type}`);
    }
    default:
      throw new DecodeEventError(`Invalid type ${typeAbi.type}`);
  }
}

function compileStructParser(
  abi: Abi,
  members: readonly AbiMember[],
): Parser<unknown> {
  const parsers: Record<string, { index: number; parser: Parser<unknown> }> =
    {};
  for (const [index, member] of members.entries()) {
    parsers[member.name] = {
      index,
      parser: compileTypeParser(abi, member.type),
    };
  }
  return parseStruct(parsers);
}
