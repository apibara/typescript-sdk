import { StreamClient, v1alpha2 } from '@apibara/protocol'
import { Filter, FieldElement, v1alpha2 as starknet } from '@apibara/starknet'
import { hash } from 'starknet'

const FACTORY_ADDR = FieldElement.fromBigInt(
  '0x00dad44c139a476c7a17fc8141e6db680e9abc9f56fe249a105094c44382c2fd'
)

const PAIR_CREATED_BN = BigInt(hash.getSelectorFromName('PairCreated'))
const PAIR_CREATED_KEY = FieldElement.fromBigInt(PAIR_CREATED_BN)

const TRANSFER_BN = BigInt(hash.getSelectorFromName('Transfer'))
const TRANSFER_KEY = FieldElement.fromBigInt(TRANSFER_BN)

const pairs: starknet.IFieldElement[] = []

function baseFilter() {
  return Filter.create()
    .withHeader()
    .addEvent((ev) => ev.withFromAddress(FACTORY_ADDR).withKeys([PAIR_CREATED_KEY]))
}

function handleBatch(client: StreamClient, cursor: v1alpha2.ICursor | null, batch: Uint8Array[]) {
  let pair_changed = false

  for (let item of batch) {
    const block = starknet.Block.decode(item)
    for (let { transaction, event } of block.events) {
      if (!event || !event.keys || !event.data || !transaction?.meta?.hash || !event.fromAddress) {
        continue
      }

      const txHash = FieldElement.toHex(transaction.meta.hash)

      const key = FieldElement.toBigInt(event.keys[0])
      if (key == PAIR_CREATED_BN) {
        pair_changed = true
        const token0 = FieldElement.toHex(event.data[0])
        const token1 = FieldElement.toHex(event.data[1])
        const pair = FieldElement.toHex(event.data[2])
        pairs.push(event.data[2])

        console.log(`Pair Created:`)
        console.log(`     Tx Hash: ${txHash}`)
        console.log(`     Address: ${pair}`)
        console.log(`      Token0: ${token0}`)
        console.log(`      Token1: ${token1}`)
      } else if (key == TRANSFER_BN) {
        const pair = FieldElement.toHex(event.fromAddress)
        const fromAddr = FieldElement.toHex(event.data[0])
        const toAddr = FieldElement.toHex(event.data[1])

        console.log(`Transfer Tkn:`)
        console.log(`     Tx Hash: ${txHash}`)
        console.log(`     Address: ${pair}`)
        console.log(`        From: ${fromAddr}`)
        console.log(`          To: ${toAddr}`)
      }
    }
  }

  if (pair_changed) {
    const filter = baseFilter()
    pairs.forEach((pair) => {
      filter.addEvent((ev) => ev.withFromAddress(pair).withKeys([TRANSFER_KEY]))
    })

    client.configure({ filter: filter.encode(), cursor })
  }
}

async function main() {
  console.log('Streaming JediSwap pools')

  const filter = baseFilter().encode()

  const client = new StreamClient({
    url: 'mainnet.starknet.a5a.ch',
  }).connect()

  // force use of batches with size 1 so that reconfiguring doesn't skip any block
  client.configure({ filter, batchSize: 1, finality: v1alpha2.DataFinality.DATA_STATUS_FINALIZED })

  for await (const message of client) {
    if (message.data && message.data?.data) {
      handleBatch(client, message.data.endCursor, message.data.data)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
