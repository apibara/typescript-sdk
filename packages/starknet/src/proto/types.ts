/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export const protobufPackage = "apibara.starknet.v1alpha2";

/**
 * StarkNet field element.
 *
 * Encoded as 4 packed uint64
 */
export interface FieldElement {
  loLo: Long;
  loHi: Long;
  hiLo: Long;
  hiHi: Long;
}

function createBaseFieldElement(): FieldElement {
  return { loLo: Long.UZERO, loHi: Long.UZERO, hiLo: Long.UZERO, hiHi: Long.UZERO };
}

export const FieldElement = {
  encode(message: FieldElement, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (!message.loLo.isZero()) {
      writer.uint32(9).fixed64(message.loLo);
    }
    if (!message.loHi.isZero()) {
      writer.uint32(17).fixed64(message.loHi);
    }
    if (!message.hiLo.isZero()) {
      writer.uint32(25).fixed64(message.hiLo);
    }
    if (!message.hiHi.isZero()) {
      writer.uint32(33).fixed64(message.hiHi);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FieldElement {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFieldElement();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.loLo = reader.fixed64() as Long;
          break;
        case 2:
          message.loHi = reader.fixed64() as Long;
          break;
        case 3:
          message.hiLo = reader.fixed64() as Long;
          break;
        case 4:
          message.hiHi = reader.fixed64() as Long;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): FieldElement {
    return {
      loLo: isSet(object.loLo) ? Long.fromValue(object.loLo) : Long.UZERO,
      loHi: isSet(object.loHi) ? Long.fromValue(object.loHi) : Long.UZERO,
      hiLo: isSet(object.hiLo) ? Long.fromValue(object.hiLo) : Long.UZERO,
      hiHi: isSet(object.hiHi) ? Long.fromValue(object.hiHi) : Long.UZERO,
    };
  },

  toJSON(message: FieldElement): unknown {
    const obj: any = {};
    message.loLo !== undefined && (obj.loLo = (message.loLo || Long.UZERO).toString());
    message.loHi !== undefined && (obj.loHi = (message.loHi || Long.UZERO).toString());
    message.hiLo !== undefined && (obj.hiLo = (message.hiLo || Long.UZERO).toString());
    message.hiHi !== undefined && (obj.hiHi = (message.hiHi || Long.UZERO).toString());
    return obj;
  },

  fromPartial(object: DeepPartial<FieldElement>): FieldElement {
    const message = createBaseFieldElement();
    message.loLo = (object.loLo !== undefined && object.loLo !== null) ? Long.fromValue(object.loLo) : Long.UZERO;
    message.loHi = (object.loHi !== undefined && object.loHi !== null) ? Long.fromValue(object.loHi) : Long.UZERO;
    message.hiLo = (object.hiLo !== undefined && object.hiLo !== null) ? Long.fromValue(object.hiLo) : Long.UZERO;
    message.hiHi = (object.hiHi !== undefined && object.hiHi !== null) ? Long.fromValue(object.hiHi) : Long.UZERO;
    return message;
  },
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Long ? string | number | Long : T extends Array<infer U> ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
