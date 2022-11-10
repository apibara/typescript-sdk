import { NodeClient, credentials } from '@apibara/protocol'
import { StreamMessagesResponse__Output } from '@apibara/protocol/dist/proto/apibara/node/v1alpha1/StreamMessagesResponse'
import { Block, Transaction, TransactionReceipt } from '@apibara/starknet'
import BN from 'bn.js'
import { Prisma, PrismaClient } from '@prisma/client'
import { getSelectorFromName } from 'starknet/dist/utils/hash'

function hexToBuffer(h: string): Buffer {
  return Buffer.from(h.replace('0x', '').padStart(64, '0'), 'hex')
}

function bufferToHex(b: Buffer | Uint8Array): string {
  return Buffer.from(b).toString('hex')
}

function uint256FromBytes(low: Buffer, high: Buffer): BN {
  const lowB = new BN(low)
  const highB = new BN(high)
  return highB.shln(128).add(lowB)
}

function transactionHash(tx: Transaction): Buffer {
  let common
  if (tx.invoke) {
    common = tx.invoke.common
  } else if (tx.declare) {
    common = tx.declare.common
  } else if (tx.deploy) {
    common = tx.deploy.common
  } else if (tx.deployAccount) {
    common = tx.deployAccount.common
  } else if (tx.l1Handler) {
    common = tx.l1Handler.common
  } else {
    throw new Error('Unknown transaction type')
  }

  if (!common?.hash) {
    throw new Error('Transaction has no hash')
  }

  return Buffer.from(common.hash)
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

  async handleData(data: StreamMessagesResponse__Output) {
    if (data.data) {
      if (!data.data.data?.value) {
        throw new Error('Received empty message from stream')
      }
      const block = Block.decode(data.data.data.value)

      if (!block.blockHash?.hash) {
        throw new Error('Block missing hash')
      }
      const blockHash = Buffer.from(block.blockHash.hash)

      // wrap everything in a transaction.
      // this ensure data is always consistent even if the indexer
      // is stopped in the middle of indexing a block.
      await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
        console.log(`Process block ${block.blockNumber} / 0x${bufferToHex(blockHash)}`)
        await this.createBlock(prisma, blockHash, block.blockNumber)

        for (let txIndex = 0; txIndex < block.transactions.length; txIndex++) {
          const receipt = block.transactionReceipts[txIndex]
          const tx = block.transactions[txIndex]
          await this.handleTransaction(prisma, blockHash, tx, receipt)
        }
      })
    } else if (data.invalidate) {
      throw new Error('invalidation not implemented')
    } else if (data.heartbeat) {
      console.debug('Received heartbeat')
    }
  }

  async handleTransaction(
    prisma: Prisma.TransactionClient,
    blockHash: Buffer,
    tx: Transaction,
    receipt: TransactionReceipt
  ) {
    const txHash = transactionHash(tx)
    for (let event of receipt.events) {
      if (!this.address.equals(event.fromAddress)) {
        continue
      }

      if (!this.event.equals(event.keys[0])) {
        continue
      }

      const fromAddress = Buffer.from(event.data[0])
      const toAddress = Buffer.from(event.data[1])
      const tokenId = uint256FromBytes(Buffer.from(event.data[2]), Buffer.from(event.data[3]))

      console.log(
        `Transfer(${bufferToHex(fromAddress)}, ${bufferToHex(toAddress)}, ${tokenId.toString()})`
      )

      await this.findOrCreateAccount(prisma, fromAddress)
      await this.findOrCreateAccount(prisma, toAddress)
      await this.updateToken(prisma, tokenId, toAddress)
      await this.createTransfer(prisma, fromAddress, toAddress, tokenId, blockHash, txHash)
    }
  }

  async findOrCreateAccount(prisma: Prisma.TransactionClient, address: Buffer) {
    const existing = await prisma.account.findUnique({
      where: {
        address,
      },
    })

    if (existing !== null) {
      return existing
    }

    return await prisma.account.create({
      data: {
        address,
      },
    })
  }

  async updateToken(prisma: Prisma.TransactionClient, tokenId: BN, ownerAddress: Buffer) {
    const id = tokenId.toBuffer('be', 32)
    return prisma.token.upsert({
      where: {
        id,
      },
      update: {
        ownerAddress,
      },
      create: {
        id,
        ownerAddress,
      },
    })
  }

  async createTransfer(
    prisma: Prisma.TransactionClient,
    fromAddress: Buffer,
    toAddress: Buffer,
    tokenId: BN,
    blockHash: Buffer,
    transactionHash: Buffer
  ) {
    const id = tokenId.toBuffer('be', 32)
    return await prisma.transfer.create({
      data: {
        toAddress,
        fromAddress,
        tokenId: id,
        blockHash,
        transactionHash,
      },
    })
  }

  async createBlock(prisma: Prisma.TransactionClient, hash: Buffer, number: number) {
    return await prisma.block.create({
      data: {
        hash,
        number,
      },
    })
  }
}

async function main() {
  const prisma = new PrismaClient()

  const briq = '0x0266b1276d23ffb53d99da3f01be7e29fa024dd33cd7f7b1eb7a46c67891c9d0'
  const indexer = new Indexer(prisma, briq, 'Transfer')

  const lastBlock = await prisma.block.findFirst({
    orderBy: {
      number: 'desc',
    },
  })

  const startingSequence = (lastBlock?.number ?? 180_000) + 1

  console.log(`Starting from ${startingSequence}`)

  const node = new NodeClient('goerli.starknet.stream.apibara.com:443', credentials.createSsl())
  const messages = node.streamMessages({ startingSequence })
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
