// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.176.0
//   protoc               unknown
// source: common.proto

/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";

export const protobufPackage = "evm.v2";

/**
 * An address of 160 bits.
 *
 * As a separate type so that the API is clearer.
 */
export interface Address {
  readonly x0?: bigint | undefined;
  readonly x1?: bigint | undefined;
  readonly x2?: number | undefined;
}

/** A bloom filter of 256 bytes. */
export interface Bloom {
  readonly value?: Uint8Array | undefined;
}

/** Unsigned integer of 128 bits. */
export interface U128 {
  readonly x0?: bigint | undefined;
  readonly x1?: bigint | undefined;
}

/** Unsigned integer of 256 bits. */
export interface U256 {
  readonly x0?: bigint | undefined;
  readonly x1?: bigint | undefined;
  readonly x2?: bigint | undefined;
  readonly x3?: bigint | undefined;
}

/** Byte array of 256 bits. */
export interface B256 {
  readonly x0?: bigint | undefined;
  readonly x1?: bigint | undefined;
  readonly x2?: bigint | undefined;
  readonly x3?: bigint | undefined;
}

function createBaseAddress(): Address {
  return { x0: BigInt("0"), x1: BigInt("0"), x2: 0 };
}

export const Address = {
  encode(message: Address, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.x0 !== undefined && message.x0 !== BigInt("0")) {
      if (BigInt.asUintN(64, message.x0) !== message.x0) {
        throw new globalThis.Error("value provided for field message.x0 of type fixed64 too large");
      }
      writer.uint32(9).fixed64(message.x0.toString());
    }
    if (message.x1 !== undefined && message.x1 !== BigInt("0")) {
      if (BigInt.asUintN(64, message.x1) !== message.x1) {
        throw new globalThis.Error("value provided for field message.x1 of type fixed64 too large");
      }
      writer.uint32(17).fixed64(message.x1.toString());
    }
    if (message.x2 !== undefined && message.x2 !== 0) {
      writer.uint32(29).fixed32(message.x2);
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

          message.x0 = longToBigint(reader.fixed64() as Long);
          continue;
        case 2:
          if (tag !== 17) {
            break;
          }

          message.x1 = longToBigint(reader.fixed64() as Long);
          continue;
        case 3:
          if (tag !== 29) {
            break;
          }

          message.x2 = reader.fixed32();
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
      x0: isSet(object.x0) ? BigInt(object.x0) : BigInt("0"),
      x1: isSet(object.x1) ? BigInt(object.x1) : BigInt("0"),
      x2: isSet(object.x2) ? globalThis.Number(object.x2) : 0,
    };
  },

  toJSON(message: Address): unknown {
    const obj: any = {};
    if (message.x0 !== undefined && message.x0 !== BigInt("0")) {
      obj.x0 = message.x0.toString();
    }
    if (message.x1 !== undefined && message.x1 !== BigInt("0")) {
      obj.x1 = message.x1.toString();
    }
    if (message.x2 !== undefined && message.x2 !== 0) {
      obj.x2 = Math.round(message.x2);
    }
    return obj;
  },

  create(base?: DeepPartial<Address>): Address {
    return Address.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<Address>): Address {
    const message = createBaseAddress() as any;
    message.x0 = object.x0 ?? BigInt("0");
    message.x1 = object.x1 ?? BigInt("0");
    message.x2 = object.x2 ?? 0;
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
  return { x0: BigInt("0"), x1: BigInt("0") };
}

export const U128 = {
  encode(message: U128, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.x0 !== undefined && message.x0 !== BigInt("0")) {
      if (BigInt.asUintN(64, message.x0) !== message.x0) {
        throw new globalThis.Error("value provided for field message.x0 of type fixed64 too large");
      }
      writer.uint32(9).fixed64(message.x0.toString());
    }
    if (message.x1 !== undefined && message.x1 !== BigInt("0")) {
      if (BigInt.asUintN(64, message.x1) !== message.x1) {
        throw new globalThis.Error("value provided for field message.x1 of type fixed64 too large");
      }
      writer.uint32(17).fixed64(message.x1.toString());
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

          message.x0 = longToBigint(reader.fixed64() as Long);
          continue;
        case 2:
          if (tag !== 17) {
            break;
          }

          message.x1 = longToBigint(reader.fixed64() as Long);
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
      x0: isSet(object.x0) ? BigInt(object.x0) : BigInt("0"),
      x1: isSet(object.x1) ? BigInt(object.x1) : BigInt("0"),
    };
  },

  toJSON(message: U128): unknown {
    const obj: any = {};
    if (message.x0 !== undefined && message.x0 !== BigInt("0")) {
      obj.x0 = message.x0.toString();
    }
    if (message.x1 !== undefined && message.x1 !== BigInt("0")) {
      obj.x1 = message.x1.toString();
    }
    return obj;
  },

  create(base?: DeepPartial<U128>): U128 {
    return U128.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<U128>): U128 {
    const message = createBaseU128() as any;
    message.x0 = object.x0 ?? BigInt("0");
    message.x1 = object.x1 ?? BigInt("0");
    return message;
  },
};

function createBaseU256(): U256 {
  return { x0: BigInt("0"), x1: BigInt("0"), x2: BigInt("0"), x3: BigInt("0") };
}

export const U256 = {
  encode(message: U256, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.x0 !== undefined && message.x0 !== BigInt("0")) {
      if (BigInt.asUintN(64, message.x0) !== message.x0) {
        throw new globalThis.Error("value provided for field message.x0 of type fixed64 too large");
      }
      writer.uint32(9).fixed64(message.x0.toString());
    }
    if (message.x1 !== undefined && message.x1 !== BigInt("0")) {
      if (BigInt.asUintN(64, message.x1) !== message.x1) {
        throw new globalThis.Error("value provided for field message.x1 of type fixed64 too large");
      }
      writer.uint32(17).fixed64(message.x1.toString());
    }
    if (message.x2 !== undefined && message.x2 !== BigInt("0")) {
      if (BigInt.asUintN(64, message.x2) !== message.x2) {
        throw new globalThis.Error("value provided for field message.x2 of type fixed64 too large");
      }
      writer.uint32(25).fixed64(message.x2.toString());
    }
    if (message.x3 !== undefined && message.x3 !== BigInt("0")) {
      if (BigInt.asUintN(64, message.x3) !== message.x3) {
        throw new globalThis.Error("value provided for field message.x3 of type fixed64 too large");
      }
      writer.uint32(33).fixed64(message.x3.toString());
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

          message.x0 = longToBigint(reader.fixed64() as Long);
          continue;
        case 2:
          if (tag !== 17) {
            break;
          }

          message.x1 = longToBigint(reader.fixed64() as Long);
          continue;
        case 3:
          if (tag !== 25) {
            break;
          }

          message.x2 = longToBigint(reader.fixed64() as Long);
          continue;
        case 4:
          if (tag !== 33) {
            break;
          }

          message.x3 = longToBigint(reader.fixed64() as Long);
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
      x0: isSet(object.x0) ? BigInt(object.x0) : BigInt("0"),
      x1: isSet(object.x1) ? BigInt(object.x1) : BigInt("0"),
      x2: isSet(object.x2) ? BigInt(object.x2) : BigInt("0"),
      x3: isSet(object.x3) ? BigInt(object.x3) : BigInt("0"),
    };
  },

  toJSON(message: U256): unknown {
    const obj: any = {};
    if (message.x0 !== undefined && message.x0 !== BigInt("0")) {
      obj.x0 = message.x0.toString();
    }
    if (message.x1 !== undefined && message.x1 !== BigInt("0")) {
      obj.x1 = message.x1.toString();
    }
    if (message.x2 !== undefined && message.x2 !== BigInt("0")) {
      obj.x2 = message.x2.toString();
    }
    if (message.x3 !== undefined && message.x3 !== BigInt("0")) {
      obj.x3 = message.x3.toString();
    }
    return obj;
  },

  create(base?: DeepPartial<U256>): U256 {
    return U256.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<U256>): U256 {
    const message = createBaseU256() as any;
    message.x0 = object.x0 ?? BigInt("0");
    message.x1 = object.x1 ?? BigInt("0");
    message.x2 = object.x2 ?? BigInt("0");
    message.x3 = object.x3 ?? BigInt("0");
    return message;
  },
};

function createBaseB256(): B256 {
  return { x0: BigInt("0"), x1: BigInt("0"), x2: BigInt("0"), x3: BigInt("0") };
}

export const B256 = {
  encode(message: B256, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.x0 !== undefined && message.x0 !== BigInt("0")) {
      if (BigInt.asUintN(64, message.x0) !== message.x0) {
        throw new globalThis.Error("value provided for field message.x0 of type fixed64 too large");
      }
      writer.uint32(9).fixed64(message.x0.toString());
    }
    if (message.x1 !== undefined && message.x1 !== BigInt("0")) {
      if (BigInt.asUintN(64, message.x1) !== message.x1) {
        throw new globalThis.Error("value provided for field message.x1 of type fixed64 too large");
      }
      writer.uint32(17).fixed64(message.x1.toString());
    }
    if (message.x2 !== undefined && message.x2 !== BigInt("0")) {
      if (BigInt.asUintN(64, message.x2) !== message.x2) {
        throw new globalThis.Error("value provided for field message.x2 of type fixed64 too large");
      }
      writer.uint32(25).fixed64(message.x2.toString());
    }
    if (message.x3 !== undefined && message.x3 !== BigInt("0")) {
      if (BigInt.asUintN(64, message.x3) !== message.x3) {
        throw new globalThis.Error("value provided for field message.x3 of type fixed64 too large");
      }
      writer.uint32(33).fixed64(message.x3.toString());
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

          message.x0 = longToBigint(reader.fixed64() as Long);
          continue;
        case 2:
          if (tag !== 17) {
            break;
          }

          message.x1 = longToBigint(reader.fixed64() as Long);
          continue;
        case 3:
          if (tag !== 25) {
            break;
          }

          message.x2 = longToBigint(reader.fixed64() as Long);
          continue;
        case 4:
          if (tag !== 33) {
            break;
          }

          message.x3 = longToBigint(reader.fixed64() as Long);
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
      x0: isSet(object.x0) ? BigInt(object.x0) : BigInt("0"),
      x1: isSet(object.x1) ? BigInt(object.x1) : BigInt("0"),
      x2: isSet(object.x2) ? BigInt(object.x2) : BigInt("0"),
      x3: isSet(object.x3) ? BigInt(object.x3) : BigInt("0"),
    };
  },

  toJSON(message: B256): unknown {
    const obj: any = {};
    if (message.x0 !== undefined && message.x0 !== BigInt("0")) {
      obj.x0 = message.x0.toString();
    }
    if (message.x1 !== undefined && message.x1 !== BigInt("0")) {
      obj.x1 = message.x1.toString();
    }
    if (message.x2 !== undefined && message.x2 !== BigInt("0")) {
      obj.x2 = message.x2.toString();
    }
    if (message.x3 !== undefined && message.x3 !== BigInt("0")) {
      obj.x3 = message.x3.toString();
    }
    return obj;
  },

  create(base?: DeepPartial<B256>): B256 {
    return B256.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<B256>): B256 {
    const message = createBaseB256() as any;
    message.x0 = object.x0 ?? BigInt("0");
    message.x1 = object.x1 ?? BigInt("0");
    message.x2 = object.x2 ?? BigInt("0");
    message.x3 = object.x3 ?? BigInt("0");
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
