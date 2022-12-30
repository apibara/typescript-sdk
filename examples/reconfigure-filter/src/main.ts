import { StreamClient, ChannelCredentials, v1alpha2 } from '@apibara/protocol'
import { Filter, FieldElement, v1alpha2 as starknet } from '@apibara/starknet'
import { hash } from 'starknet'

async function main() {
  console.log('Streaming JediSwap pools')

  // Encode factory address to the wire format.
  const factoryAddress = FieldElement.fromBigInt(
    '0x0329d90b8dd38a089e2c4d1e1b6f0caab166f769bda267b7d4118f06b07fed87'
  )

  const pairCreatedKey = [FieldElement.fromBigInt(hash.getSelectorFromName('PairCreated'))]

  const filter = Filter.create()
    .addEvent((ev) => ev.withFromAddress(factoryAddress).withKeys(pairCreatedKey))
    .encode()

  const client = new StreamClient({
    url: 'localhost:7171',
    credentials: ChannelCredentials.createInsecure(),
  }).connect()

  client.configure({ filter, batchSize: 10, finality: v1alpha2.DataFinality.DATA_STATUS_FINALIZED })

  for await (const message of client) {
    if (message.data?.data) {
      for (let item of message.data.data) {
        const block = starknet.Block.decode(item)
        console.log(block)
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
