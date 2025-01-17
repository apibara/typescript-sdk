import type { Abi } from "abi-wan-kanabi";
import type {
  AbiEventMember,
  EventToPrimitiveType,
  ExtractAbiEventNames,
} from "abi-wan-kanabi/kanabi";
import {
  PrimitiveTypeParsers,
  getArrayElementType,
  getEventSelector,
  getOptionType,
  getSpanType,
  isArrayType,
  isEmptyType,
  isOptionType,
  isPrimitiveType,
  isSpanType,
} from "./abi";
import type { Event } from "./block";
import {
  ParseError,
  type Parser,
  parseArray,
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

  if (!eventAbi || eventAbi.type !== "event") {
    if (strict) {
      throw new DecodeEventError(`Event ${eventName} not found in ABI`);
    }

    return null as DecodeEventReturn<TAbi, TEventName, TStrict>;
  }

  if (eventAbi.kind === "enum") {
    throw new DecodeEventError("enum: not implemented");
  }

  const selector = BigInt(getEventSelector(eventName));
  if ((event.keys && selector !== BigInt(event.keys[0])) || !event.keys) {
    if (strict) {
      throw new DecodeEventError(
        `Selector mismatch. Expected ${selector}, got ${event.keys?.[0]}`,
      );
    }

    return null as DecodeEventReturn<TAbi, TEventName, TStrict>;
  }

  const keysAbi = eventAbi.members.filter((m) => m.kind === "key");
  const dataAbi = eventAbi.members.filter((m) => m.kind === "data");

  try {
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
  } catch (error) {
    if (error instanceof DecodeEventError && !strict) {
      return null as DecodeEventReturn<TAbi, TEventName, TStrict>;
    }

    if (error instanceof ParseError && !strict) {
      return null as DecodeEventReturn<TAbi, TEventName, TStrict>;
    }

    throw error;
  }
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

  // Not a well-known type. Look it up in the ABI.
  const typeAbi = abi.find((item) => item.name === type);
  if (!typeAbi) {
    throw new DecodeEventError(`Type ${type} not found in ABI`);
  }

  switch (typeAbi.type) {
    case "struct": {
      return compileStructParser(abi, typeAbi.members);
    }
    case "enum":
      throw new DecodeEventError("enum: not implemented");
    default:
      throw new DecodeEventError(`Invalid type ${typeAbi.type}`);
  }
}

type AbiMember = {
  name: string;
  type: string;
};

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
