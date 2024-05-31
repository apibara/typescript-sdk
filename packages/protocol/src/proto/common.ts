// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.176.0
//   protoc               unknown
// source: common.proto

/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export const protobufPackage = "dna.v2.common";

/** A cursor over the stream content. */
export interface Cursor {
  /** Key used for ordering messages in the stream. */
  readonly orderKey: bigint;
  /** Key used to discriminate branches in the stream. */
  readonly uniqueKey: Uint8Array;
}

/** Request for the `Status` method. */
export interface StatusRequest {
}

/** Response for the `Status` method. */
export interface StatusResponse {
  /** The current head of the chain. */
  readonly currentHead?:
    | Cursor
    | undefined;
  /** The last cursor that was ingested by the node. */
  readonly lastIngested?: Cursor | undefined;
}

function createBaseCursor(): Cursor {
  return { orderKey: BigInt("0"), uniqueKey: new Uint8Array(0) };
}

export const Cursor = {
  encode(message: Cursor, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.orderKey !== BigInt("0")) {
      if (BigInt.asUintN(64, message.orderKey) !== message.orderKey) {
        throw new globalThis.Error("value provided for field message.orderKey of type uint64 too large");
      }
      writer.uint32(8).uint64(message.orderKey.toString());
    }
    if (message.uniqueKey.length !== 0) {
      writer.uint32(18).bytes(message.uniqueKey);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Cursor {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCursor() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.orderKey = longToBigint(reader.uint64() as Long);
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.uniqueKey = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Cursor {
    return {
      orderKey: isSet(object.orderKey) ? BigInt(object.orderKey) : BigInt("0"),
      uniqueKey: isSet(object.uniqueKey) ? bytesFromBase64(object.uniqueKey) : new Uint8Array(0),
    };
  },

  toJSON(message: Cursor): unknown {
    const obj: any = {};
    if (message.orderKey !== BigInt("0")) {
      obj.orderKey = message.orderKey.toString();
    }
    if (message.uniqueKey.length !== 0) {
      obj.uniqueKey = base64FromBytes(message.uniqueKey);
    }
    return obj;
  },

  create(base?: DeepPartial<Cursor>): Cursor {
    return Cursor.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<Cursor>): Cursor {
    const message = createBaseCursor() as any;
    message.orderKey = object.orderKey ?? BigInt("0");
    message.uniqueKey = object.uniqueKey ?? new Uint8Array(0);
    return message;
  },
};

function createBaseStatusRequest(): StatusRequest {
  return {};
}

export const StatusRequest = {
  encode(_: StatusRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StatusRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStatusRequest() as any;
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

  fromJSON(_: any): StatusRequest {
    return {};
  },

  toJSON(_: StatusRequest): unknown {
    const obj: any = {};
    return obj;
  },

  create(base?: DeepPartial<StatusRequest>): StatusRequest {
    return StatusRequest.fromPartial(base ?? {});
  },
  fromPartial(_: DeepPartial<StatusRequest>): StatusRequest {
    const message = createBaseStatusRequest() as any;
    return message;
  },
};

function createBaseStatusResponse(): StatusResponse {
  return { currentHead: undefined, lastIngested: undefined };
}

export const StatusResponse = {
  encode(message: StatusResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.currentHead !== undefined) {
      Cursor.encode(message.currentHead, writer.uint32(10).fork()).ldelim();
    }
    if (message.lastIngested !== undefined) {
      Cursor.encode(message.lastIngested, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StatusResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStatusResponse() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.currentHead = Cursor.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.lastIngested = Cursor.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): StatusResponse {
    return {
      currentHead: isSet(object.currentHead) ? Cursor.fromJSON(object.currentHead) : undefined,
      lastIngested: isSet(object.lastIngested) ? Cursor.fromJSON(object.lastIngested) : undefined,
    };
  },

  toJSON(message: StatusResponse): unknown {
    const obj: any = {};
    if (message.currentHead !== undefined) {
      obj.currentHead = Cursor.toJSON(message.currentHead);
    }
    if (message.lastIngested !== undefined) {
      obj.lastIngested = Cursor.toJSON(message.lastIngested);
    }
    return obj;
  },

  create(base?: DeepPartial<StatusResponse>): StatusResponse {
    return StatusResponse.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<StatusResponse>): StatusResponse {
    const message = createBaseStatusResponse() as any;
    message.currentHead = (object.currentHead !== undefined && object.currentHead !== null)
      ? Cursor.fromPartial(object.currentHead)
      : undefined;
    message.lastIngested = (object.lastIngested !== undefined && object.lastIngested !== null)
      ? Cursor.fromPartial(object.lastIngested)
      : undefined;
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