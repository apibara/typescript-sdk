import { hexToBytes } from "viem";
import type * as proto from "./proto";

export type Address = `0x${string}`;

export const Address = {
  toProto(message: Address): proto.common.Address {
    const bytes = hexToBytes(message, { size: 20 });
    const dv = new DataView(bytes.buffer);
    return {
      loLo: dv.getBigUint64(0, false),
      loHi: dv.getBigUint64(8, false),
      hi: dv.getUint32(16, false),
    };
  },
};

export type B256 = `0x${string}`;

export const B256 = {
  toProto(message: B256): proto.common.B256 {
    const bytes = hexToBytes(message, { size: 32 });
    const dv = new DataView(bytes.buffer);
    return {
      loLo: dv.getBigUint64(0, false),
      loHi: dv.getBigUint64(8, false),
      hiLo: dv.getBigUint64(16, false),
      hiHi: dv.getBigUint64(24, false),
    };
  },

  fromProto(message: proto.common.B256): B256 {
    return `0x${message.loLo.toString(16).padStart(16, "0")}${message.loHi
      .toString(16)
      .padStart(16, "0")}${message.hiLo
      .toString(16)
      .padStart(16, "0")}${message.hiHi.toString(16).padStart(16, "0")}`;
  },
};
