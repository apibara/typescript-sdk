import { StreamClient, ChannelCredentials, StreamDataRequest, v1alpha2 } from '@apibara/protocol'
import { Filter, FieldElement, v1alpha2 as starknet } from '@apibara/starknet'

async function main() {
  console.log('Streaming all Transfer events for ETH')

  // Encode address to the wire format.
  const _address = FieldElement.fromBigInt(
    '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'
  )

  // Create stream filter. The client will only receive the specified data.
  const filter = Filter.create()
    .addTransaction((b) => b.any())
    .encode()

  const client = new StreamClient('localhost:7171', ChannelCredentials.createInsecure())

  const stream = client.connect()

  stream.on('data', (message) => {
    if (message.data?.data) {
      for (let item of message.data.data) {
        const block = starknet.Block.decode(item)
        for (let tx of block.transactions) {
          const hash = FieldElement.toBigInt(tx.transaction.meta.hash)
          console.log(`0x${hash.toString(16)}`)
        }
      }
    }
  })

  stream.write(
    StreamDataRequest.create()
      .withFinality(v1alpha2.DataFinality.DATA_STATUS_FINALIZED)
      .withBatchSize(10)
      .withFilter(filter)
      .encode()
  )
  return new Promise((resolve, reject) => {
    stream.on('end', resolve)
    stream.on('error', reject)
  })
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
