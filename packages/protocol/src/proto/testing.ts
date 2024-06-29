// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.176.0
//   protoc               unknown
// source: testing.proto

/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export const protobufPackage = "dna.v2.testing";

export interface MockFilter {
}

export interface MockBlock {
  readonly blockNumber: bigint;
}

function createBaseMockFilter(): MockFilter {
  return {};
}

export const MockFilter = {
  encode(_: MockFilter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MockFilter {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMockFilter() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): MockFilter {
    return {};
  },

  toJSON(_: MockFilter): unknown {
    const obj: any = {};
    return obj;
  },

  create(base?: DeepPartial<MockFilter>): MockFilter {
    return MockFilter.fromPartial(base ?? {});
  },
  fromPartial(_: DeepPartial<MockFilter>): MockFilter {
    const message = createBaseMockFilter() as any;
    return message;
  },
};

function createBaseMockBlock(): MockBlock {
  return { blockNumber: BigInt("0") };
}

export const MockBlock = {
  encode(message: MockBlock, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.blockNumber !== BigInt("0")) {
      if (BigInt.asUintN(64, message.blockNumber) !== message.blockNumber) {
        throw new globalThis.Error("value provided for field message.blockNumber of type uint64 too large");
      }
      writer.uint32(8).uint64(message.blockNumber.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MockBlock {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMockBlock() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.blockNumber = longToBigint(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MockBlock {
    return { blockNumber: isSet(object.blockNumber) ? BigInt(object.blockNumber) : BigInt("0") };
  },

  toJSON(message: MockBlock): unknown {
    const obj: any = {};
    if (message.blockNumber !== BigInt("0")) {
      obj.blockNumber = message.blockNumber.toString();
    }
    return obj;
  },

  create(base?: DeepPartial<MockBlock>): MockBlock {
    return MockBlock.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<MockBlock>): MockBlock {
    const message = createBaseMockBlock() as any;
    message.blockNumber = object.blockNumber ?? BigInt("0");
    return message;
  },
};

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