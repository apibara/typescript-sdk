import { Block } from './index'

describe('Block', () => {
  it('encodes and decodes block data', () => {
    const blockHash = { hash: new Uint8Array(32) }
    const parentBlockHash = { hash: new Uint8Array(32) }
    const blockNumber = 1
    const sequencerAddress = new Uint8Array(32)
    const stateRoot = new Uint8Array(32)
    const timestamp = new Date(2022, 1, 1)
    const gasPrice = new Uint8Array(32)
    const starknetVersion = '0x1'

    const block = Block.encode({
      blockHash,
      parentBlockHash,
      blockNumber,
      sequencerAddress,
      stateRoot,
      timestamp,
      gasPrice,
      starknetVersion,
      transactions: [],
      transactionReceipts: [],
    })

    const back = Block.decode(block.finish())
    expect(back.blockNumber).toEqual(1)
    expect(back.timestamp).toEqual(timestamp)
  })
})
