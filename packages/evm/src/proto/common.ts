// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.176.0
//   protoc               unknown
// source: common.proto

/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export const protobufPackage = "evm.v2";

/**
 * An address of 160 bits.
 *
 * As a separate type so that the API is clearer.
 */
export interface Address {
  readonly loLo?: bigint | undefined;
  readonly loHi?: bigint | undefined;
  readonly hi?: number | undefined;
}

/** A bloom filter of 256 bytes. */
export interface Bloom {
  readonly value?: Uint8Array | undefined;
}

/** Unsigned integer of 128 bits. */
export interface U128 {
  readonly lo?: bigint | undefined;
  readonly hi?: bigint | undefined;
}

/** Unsigned integer of 256 bits. */
export interface U256 {
  readonly loLo?: bigint | undefined;
  readonly loHi?: bigint | undefined;
  readonly hiLo?: bigint | undefined;
  readonly hiHi?: bigint | undefined;
}

/** Byte array of 256 bits. */
export interface B256 {
  readonly loLo?: bigint | undefined;
  readonly loHi?: bigint | undefined;
  readonly hiLo?: bigint | undefined;
  readonly hiHi?: bigint | undefined;
}

/** / Arbitrary data that should be hex-encoded. */
export interface HexData {
  readonly value?: Uint8Array | undefined;
}

function createBaseAddress(): Address {
  return { loLo: BigInt("0"), loHi: BigInt("0"), hi: 0 };
}

export const Address = {
  encode(message: Address, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.loLo !== undefined && message.loLo !== BigInt("0")) {
      if (BigInt.asUintN(64, message.loLo) !== message.loLo) {
        throw new globalThis.Error("value provided for field message.loLo of type fixed64 too large");
      }
      writer.uint32(9).fixed64(message.loLo.toString());
    }
    if (message.loHi !== undefined && message.loHi !== BigInt("0")) {
      if (BigInt.asUintN(64, message.loHi) !== message.loHi) {
        throw new globalThis.Error("value provided for field message.loHi of type fixed64 too large");
      }
      writer.uint32(17).fixed64(message.loHi.toString());
    }
    if (message.hi !== undefined && message.hi !== 0) {
      writer.uint32(29).fixed32(message.hi);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Address {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAddress() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 9) {
            break;
          }

          message.loLo = longToBigint(reader.fixed64() as Long);
          continue;
        case 2:
          if (tag !== 17) {
            break;
          }

          message.loHi = longToBigint(reader.fixed64() as Long);
          continue;
        case 3:
          if (tag !== 29) {
            break;
          }

          message.hi = reader.fixed32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Address {
    return {
      loLo: isSet(object.loLo) ? BigInt(object.loLo) : BigInt("0"),
      loHi: isSet(object.loHi) ? BigInt(object.loHi) : BigInt("0"),
      hi: isSet(object.hi) ? globalThis.Number(object.hi) : 0,
    };
  },

  toJSON(message: Address): unknown {
    const obj: any = {};
    if (message.loLo !== undefined && message.loLo !== BigInt("0")) {
      obj.loLo = message.loLo.toString();
    }
    if (message.loHi !== undefined && message.loHi !== BigInt("0")) {
      obj.loHi = message.loHi.toString();
    }
    if (message.hi !== undefined && message.hi !== 0) {
      obj.hi = Math.round(message.hi);
    }
    return obj;
  },

  create(base?: DeepPartial<Address>): Address {
    return Address.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<Address>): Address {
    const message = createBaseAddress() as any;
    message.loLo = object.loLo ?? BigInt("0");
    message.loHi = object.loHi ?? BigInt("0");
    message.hi = object.hi ?? 0;
    return message;
  },
};

function createBaseBloom(): Bloom {
  return { value: new Uint8Array(0) };
}

export const Bloom = {
  encode(message: Bloom, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.value !== undefined && message.value.length !== 0) {
      writer.uint32(10).bytes(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Bloom {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBloom() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.value = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Bloom {
    return { value: isSet(object.value) ? bytesFromBase64(object.value) : new Uint8Array(0) };
  },

  toJSON(message: Bloom): unknown {
    const obj: any = {};
    if (message.value !== undefined && message.value.length !== 0) {
      obj.value = base64FromBytes(message.value);
    }
    return obj;
  },

  create(base?: DeepPartial<Bloom>): Bloom {
    return Bloom.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<Bloom>): Bloom {
    const message = createBaseBloom() as any;
    message.value = object.value ?? new Uint8Array(0);
    return message;
  },
};

function createBaseU128(): U128 {
  return { lo: BigInt("0"), hi: BigInt("0") };
}

export const U128 = {
  encode(message: U128, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.lo !== undefined && message.lo !== BigInt("0")) {
      if (BigInt.asUintN(64, message.lo) !== message.lo) {
        throw new globalThis.Error("value provided for field message.lo of type fixed64 too large");
      }
      writer.uint32(9).fixed64(message.lo.toString());
    }
    if (message.hi !== undefined && message.hi !== BigInt("0")) {
      if (BigInt.asUintN(64, message.hi) !== message.hi) {
        throw new globalThis.Error("value provided for field message.hi of type fixed64 too large");
      }
      writer.uint32(17).fixed64(message.hi.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): U128 {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseU128() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 9) {
            break;
          }

          message.lo = longToBigint(reader.fixed64() as Long);
          continue;
        case 2:
          if (tag !== 17) {
            break;
          }

          message.hi = longToBigint(reader.fixed64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): U128 {
    return {
      lo: isSet(object.lo) ? BigInt(object.lo) : BigInt("0"),
      hi: isSet(object.hi) ? BigInt(object.hi) : BigInt("0"),
    };
  },

  toJSON(message: U128): unknown {
    const obj: any = {};
    if (message.lo !== undefined && message.lo !== BigInt("0")) {
      obj.lo = message.lo.toString();
    }
    if (message.hi !== undefined && message.hi !== BigInt("0")) {
      obj.hi = message.hi.toString();
    }
    return obj;
  },

  create(base?: DeepPartial<U128>): U128 {
    return U128.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<U128>): U128 {
    const message = createBaseU128() as any;
    message.lo = object.lo ?? BigInt("0");
    message.hi = object.hi ?? BigInt("0");
    return message;
  },
};

function createBaseU256(): U256 {
  return { loLo: BigInt("0"), loHi: BigInt("0"), hiLo: BigInt("0"), hiHi: BigInt("0") };
}

export const U256 = {
  encode(message: U256, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.loLo !== undefined && message.loLo !== BigInt("0")) {
      if (BigInt.asUintN(64, message.loLo) !== message.loLo) {
        throw new globalThis.Error("value provided for field message.loLo of type fixed64 too large");
      }
      writer.uint32(9).fixed64(message.loLo.toString());
    }
    if (message.loHi !== undefined && message.loHi !== BigInt("0")) {
      if (BigInt.asUintN(64, message.loHi) !== message.loHi) {
        throw new globalThis.Error("value provided for field message.loHi of type fixed64 too large");
      }
      writer.uint32(17).fixed64(message.loHi.toString());
    }
    if (message.hiLo !== undefined && message.hiLo !== BigInt("0")) {
      if (BigInt.asUintN(64, message.hiLo) !== message.hiLo) {
        throw new globalThis.Error("value provided for field message.hiLo of type fixed64 too large");
      }
      writer.uint32(25).fixed64(message.hiLo.toString());
    }
    if (message.hiHi !== undefined && message.hiHi !== BigInt("0")) {
      if (BigInt.asUintN(64, message.hiHi) !== message.hiHi) {
        throw new globalThis.Error("value provided for field message.hiHi of type fixed64 too large");
      }
      writer.uint32(33).fixed64(message.hiHi.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): U256 {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseU256() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 9) {
            break;
          }

          message.loLo = longToBigint(reader.fixed64() as Long);
          continue;
        case 2:
          if (tag !== 17) {
            break;
          }

          message.loHi = longToBigint(reader.fixed64() as Long);
          continue;
        case 3:
          if (tag !== 25) {
            break;
          }

          message.hiLo = longToBigint(reader.fixed64() as Long);
          continue;
        case 4:
          if (tag !== 33) {
            break;
          }

          message.hiHi = longToBigint(reader.fixed64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): U256 {
    return {
      loLo: isSet(object.loLo) ? BigInt(object.loLo) : BigInt("0"),
      loHi: isSet(object.loHi) ? BigInt(object.loHi) : BigInt("0"),
      hiLo: isSet(object.hiLo) ? BigInt(object.hiLo) : BigInt("0"),
      hiHi: isSet(object.hiHi) ? BigInt(object.hiHi) : BigInt("0"),
    };
  },

  toJSON(message: U256): unknown {
    const obj: any = {};
    if (message.loLo !== undefined && message.loLo !== BigInt("0")) {
      obj.loLo = message.loLo.toString();
    }
    if (message.loHi !== undefined && message.loHi !== BigInt("0")) {
      obj.loHi = message.loHi.toString();
    }
    if (message.hiLo !== undefined && message.hiLo !== BigInt("0")) {
      obj.hiLo = message.hiLo.toString();
    }
    if (message.hiHi !== undefined && message.hiHi !== BigInt("0")) {
      obj.hiHi = message.hiHi.toString();
    }
    return obj;
  },

  create(base?: DeepPartial<U256>): U256 {
    return U256.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<U256>): U256 {
    const message = createBaseU256() as any;
    message.loLo = object.loLo ?? BigInt("0");
    message.loHi = object.loHi ?? BigInt("0");
    message.hiLo = object.hiLo ?? BigInt("0");
    message.hiHi = object.hiHi ?? BigInt("0");
    return message;
  },
};

function createBaseB256(): B256 {
  return { loLo: BigInt("0"), loHi: BigInt("0"), hiLo: BigInt("0"), hiHi: BigInt("0") };
}

export const B256 = {
  encode(message: B256, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.loLo !== undefined && message.loLo !== BigInt("0")) {
      if (BigInt.asUintN(64, message.loLo) !== message.loLo) {
        throw new globalThis.Error("value provided for field message.loLo of type fixed64 too large");
      }
      writer.uint32(9).fixed64(message.loLo.toString());
    }
    if (message.loHi !== undefined && message.loHi !== BigInt("0")) {
      if (BigInt.asUintN(64, message.loHi) !== message.loHi) {
        throw new globalThis.Error("value provided for field message.loHi of type fixed64 too large");
      }
      writer.uint32(17).fixed64(message.loHi.toString());
    }
    if (message.hiLo !== undefined && message.hiLo !== BigInt("0")) {
      if (BigInt.asUintN(64, message.hiLo) !== message.hiLo) {
        throw new globalThis.Error("value provided for field message.hiLo of type fixed64 too large");
      }
      writer.uint32(25).fixed64(message.hiLo.toString());
    }
    if (message.hiHi !== undefined && message.hiHi !== BigInt("0")) {
      if (BigInt.asUintN(64, message.hiHi) !== message.hiHi) {
        throw new globalThis.Error("value provided for field message.hiHi of type fixed64 too large");
      }
      writer.uint32(33).fixed64(message.hiHi.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): B256 {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseB256() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 9) {
            break;
          }

          message.loLo = longToBigint(reader.fixed64() as Long);
          continue;
        case 2:
          if (tag !== 17) {
            break;
          }

          message.loHi = longToBigint(reader.fixed64() as Long);
          continue;
        case 3:
          if (tag !== 25) {
            break;
          }

          message.hiLo = longToBigint(reader.fixed64() as Long);
          continue;
        case 4:
          if (tag !== 33) {
            break;
          }

          message.hiHi = longToBigint(reader.fixed64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): B256 {
    return {
      loLo: isSet(object.loLo) ? BigInt(object.loLo) : BigInt("0"),
      loHi: isSet(object.loHi) ? BigInt(object.loHi) : BigInt("0"),
      hiLo: isSet(object.hiLo) ? BigInt(object.hiLo) : BigInt("0"),
      hiHi: isSet(object.hiHi) ? BigInt(object.hiHi) : BigInt("0"),
    };
  },

  toJSON(message: B256): unknown {
    const obj: any = {};
    if (message.loLo !== undefined && message.loLo !== BigInt("0")) {
      obj.loLo = message.loLo.toString();
    }
    if (message.loHi !== undefined && message.loHi !== BigInt("0")) {
      obj.loHi = message.loHi.toString();
    }
    if (message.hiLo !== undefined && message.hiLo !== BigInt("0")) {
      obj.hiLo = message.hiLo.toString();
    }
    if (message.hiHi !== undefined && message.hiHi !== BigInt("0")) {
      obj.hiHi = message.hiHi.toString();
    }
    return obj;
  },

  create(base?: DeepPartial<B256>): B256 {
    return B256.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<B256>): B256 {
    const message = createBaseB256() as any;
    message.loLo = object.loLo ?? BigInt("0");
    message.loHi = object.loHi ?? BigInt("0");
    message.hiLo = object.hiLo ?? BigInt("0");
    message.hiHi = object.hiHi ?? BigInt("0");
    return message;
  },
};

function createBaseHexData(): HexData {
  return { value: new Uint8Array(0) };
}

export const HexData = {
  encode(message: HexData, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.value !== undefined && message.value.length !== 0) {
      writer.uint32(10).bytes(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): HexData {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHexData() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.value = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): HexData {
    return { value: isSet(object.value) ? bytesFromBase64(object.value) : new Uint8Array(0) };
  },

  toJSON(message: HexData): unknown {
    const obj: any = {};
    if (message.value !== undefined && message.value.length !== 0) {
      obj.value = base64FromBytes(message.value);
    }
    return obj;
  },

  create(base?: DeepPartial<HexData>): HexData {
    return HexData.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<HexData>): HexData {
    const message = createBaseHexData() as any;
    message.value = object.value ?? new Uint8Array(0);
    return message;
  },
};

function bytesFromBase64(b64: string): Uint8Array {
  if ((globalThis as any).Buffer) {
    return Uint8Array.from(globalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = globalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if ((globalThis as any).Buffer) {
    return globalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(globalThis.String.fromCharCode(byte));
    });
    return globalThis.btoa(bin.join(""));
  }
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | bigint | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends { readonly $case: string }
    ? { [K in keyof Omit<T, "$case">]?: DeepPartial<T[K]> } & { readonly $case: T["$case"] }
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

function longToBigint(long: Long) {
  return BigInt(long.toString());
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}