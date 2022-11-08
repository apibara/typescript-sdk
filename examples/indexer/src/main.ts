import { NodeClient, credentials } from '@apibara/protocol'
import { StreamMessagesResponse__Output } from '@apibara/protocol/dist/proto/apibara/node/v1alpha1/StreamMessagesResponse'
import { Block, Transaction, TransactionReceipt } from '@apibara/starknet'
import { PrismaClient } from '@prisma/client'
import { getSelectorFromName } from 'starknet/dist/utils/hash'

function hexToBuffer(h: string): Buffer {
  return Buffer.from(h.replace('0x', '').padStart(64, '0'), 'hex')
}

function bufferToHex(b: Buffer | Uint8Array): string {
  return Buffer.from(b).toString('hex')
}

class Indexer {
  prisma: PrismaClient
  address: Buffer
  event: Buffer

  constructor(prisma: PrismaClient, address: string, event: string) {
    this.prisma = prisma
    this.address = hexToBuffer(address)
    this.event = hexToBuffer(getSelectorFromName(event))
  }

  async handleTransaction(tx: Transaction, receipt: TransactionReceipt) {
    for (let event of receipt.events) {
      if (!this.address.equals(event.fromAddress)) {
        continue
      }

      if (!this.event.equals(event.keys[0])) {
        continue
      }

      const fromAddress = event.data[0]
      const toAddress = event.data[1]
      console.log(`Transfer(${bufferToHex(fromAddress)}, ${bufferToHex(toAddress)})`)
      // const tokenId = { low: event.data[2], high: event.data[3] }
      // console.log(event)
    }
  }

  async handleData(data: StreamMessagesResponse__Output) {
    if (data.data) {
      if (!data.data.data?.value) {
        throw new Error('Received empty message from stream')
      }
      const block = Block.decode(data.data.data.value)
      console.log(`Process block ${block.blockNumber}`)
      for (let txIndex = 0; txIndex < block.transactions.length; txIndex++) {
        const receipt = block.transactionReceipts[txIndex]
        const tx = block.transactions[txIndex]
        await this.handleTransaction(tx, receipt)
      }
    } else if (data.invalidate) {
      throw new Error('invalidation not implemented')
    } else if (data.heartbeat) {
      console.debug('Received heartbeat')
    }
  }
}

async function main() {
  const prisma = new PrismaClient()

  const briq = '0x0266b1276d23ffb53d99da3f01be7e29fa024dd33cd7f7b1eb7a46c67891c9d0'
  const indexer = new Indexer(prisma, briq, 'Transfer')

  const node = new NodeClient('goerli.starknet.stream.apibara.com:443', credentials.createSsl())
  const messages = node.streamMessages({ startingSequence: 180_000 })
  return new Promise((resolve, reject) => {
    messages.on('end', resolve)
    messages.on('error', reject)
    messages.on('data', async (data: StreamMessagesResponse__Output) => {
      await indexer.handleData(data)
    })
  })
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
