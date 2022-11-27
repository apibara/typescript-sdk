import { NodeClient, credentials } from '@apibara/protocol'
import { StreamMessagesResponse__Output } from '@apibara/protocol/dist/proto/apibara/node/v1alpha1/StreamMessagesResponse'
import { Block } from '@apibara/starknet'

async function main() {
  const node = new NodeClient('mainnet.starknet.stream.apibara.com:443', credentials.createSsl())
  // start streaming from a recent block to reach the chain's head sooner.
  // opt-in to receive pending data every 5 seconds
  const messages = node.streamMessages({
    startingSequence: 12_100,
    pendingBlockIntervalSeconds: 5,
  })

  return new Promise((resolve, reject) => {
    messages.on('end', resolve)
    messages.on('error', reject)
    messages.on('data', (message: StreamMessagesResponse__Output) => {
      if (message.data && message.data.data?.value) {
        const block = Block.decode(message.data.data.value)
        console.log(`Accepted Block ${block.blockNumber} ${block.transactions.length}`)
      } else if (message.pending && message.pending.data?.value) {
        const block = Block.decode(message.pending.data.value)
        console.log(`Pending Block ${block.blockNumber} ${block.transactions.length}`)
      }
    })
  })
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
