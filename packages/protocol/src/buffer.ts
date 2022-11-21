/**
 * Converts the hex-encoded bytes to a `Buffer`.
 * @param hex The hex string
 * @param size The buffer size, in bits
 */
export function hexToBuffer(hex: string, size: number): Buffer {
  const padSize = size * 2
  return Buffer.from(hex.replace('0x', '').padStart(padSize, '0'), 'hex')
}

/**
 *  Converts the buffer to its hex representation.
 * @param buff the buffer
 */
export function bufferToHex(buff: Buffer): string {
  return '0x' + buff.toString('hex')
}
