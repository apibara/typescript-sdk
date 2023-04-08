import Long from 'long'
import { v1alpha2 } from './proto'

export const H256 = {
  encode: v1alpha2.H256.encode,
  decode: v1alpha2.H256.decode,
  fromObject: v1alpha2.H256.fromObject,
  toObject: v1alpha2.H256.toObject,

  /**
   * Converts from the wire representation to a bigint.
   */
  toBigInt(message: v1alpha2.IH256): bigint {
    const hiHi = hexEncodedU64(message.hiHi)
    const hiLo = hexEncodedU64(message.hiLo)
    const loHi = hexEncodedU64(message.loHi)
    const loLo = hexEncodedU64(message.loLo)
    return BigInt(`0x${loLo}${loHi}${hiLo}${hiHi}`)
  },

  /**
   * Returns the wire representation of the given bigint.
   */
  fromBigInt(number: string | number | bigint): v1alpha2.IH256 {
    if (number < 0) {
      throw new Error('H256 outside of range')
    }

    const bn = BigInt(number)
    // bit-shifting of a big int doesn't make much sense.
    // convert to hex and from there breakup in pieces
    const hex = bn.toString(16).padStart(64, '0')
    const s = hex.length
    const hiHi = Long.fromString(hex.slice(s - 16, s), true, 16)
    const hiLo = Long.fromString(hex.slice(s - 32, s - 16), true, 16)
    const loHi = Long.fromString(hex.slice(s - 48, s - 32), true, 16)
    const loLo = Long.fromString(hex.slice(s - 64, s - 48), true, 16)

    return {
      hiHi,
      hiLo,
      loHi,
      loLo,
    }
  },

  /**
   * Returns the hex value of the hash.
   */
  toHex(message: v1alpha2.IH256): string {
    const num = this.toBigInt(message)
    return `0x${num.toString(16).padStart(64, '0')}`
  },
}

export const H160 = {
  encode: v1alpha2.H160.encode,
  decode: v1alpha2.H160.decode,
  fromObject: v1alpha2.H160.fromObject,
  toObject: v1alpha2.H160.toObject,

  /**
   * Converts from the wire representation to a bigint.
   */
  toBigInt(message: v1alpha2.IH160): bigint {
    const hi = hexEncodedU32(message.hi)
    const loHi = hexEncodedU64(message.loHi)
    const loLo = hexEncodedU64(message.loLo)
    return BigInt(`0x${loLo}${loHi}${hi}`)
  },

  /**
   * Returns the wire representation of the given bigint.
   */
  fromBigInt(number: string | number | bigint): v1alpha2.IH160 {
    if (number < 0) {
      throw new Error('H160 outside of range')
    }

    const bn = BigInt(number)
    // bit-shifting of a big int doesn't make much sense.
    // convert to hex and from there breakup in pieces
    const hex = bn.toString(16).padStart(40, '0')
    const s = hex.length
    const hi = Long.fromString(hex.slice(s - 8, s), true, 16).toNumber()
    const loHi = Long.fromString(hex.slice(s - 24, s - 8), true, 16)
    const loLo = Long.fromString(hex.slice(s - 40, s - 24), true, 16)

    return {
      hi,
      loHi,
      loLo,
    }
  },

  /**
   * Returns the hex value of the hash.
   */
  toHex(message: v1alpha2.IH160): string {
    const num = this.toBigInt(message)
    return `0x${num.toString(16).padStart(64, '0')}`
  },
}

function hexEncodedU64(n: Long | number | null | undefined): string {
  const s = n?.toString(16) ?? ''
  return s.padStart(16, '0')
}

function hexEncodedU32(n: Long | number | null | undefined): string {
  const s = n?.toString(16) ?? ''
  return s.padStart(8, '0')
}
