import { NodeClient, credentials } from '@apibara/protocol'
import { StreamMessagesResponse__Output } from '@apibara/protocol/dist/proto/apibara/node/v1alpha1/StreamMessagesResponse'
import { Block } from '@apibara/starknet'

async function main() {
  const node = new NodeClient('goerli.starknet.stream.apibara.com:443', credentials.createSsl())
  const messages = node.streamMessages({})
  return new Promise((resolve, reject) => {
    messages.on('end', resolve)
    messages.on('error', reject)
    messages.on('data', (data: StreamMessagesResponse__Output) => {
      const value = data.data?.data?.value
      if (value) {
        const block = Block.decode(value)
        console.log(`${block.blockNumber} ${block.transactions.length}`)
      }
    })
  })
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
