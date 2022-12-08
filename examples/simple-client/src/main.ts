import { NodeClient, credentials, proto } from '@apibara/protocol'
import { StreamMessagesResponse__Output } from '@apibara/protocol/dist/proto/apibara/node/v1alpha1/StreamMessagesResponse'
import { Block } from '@apibara/starknet'

/**
 * AppIndexer is used to keep track of the indexer's state between different
 * calls.
 */
class AppIndexer {
  // protobuf encodes possibly-large numbers as strings
  private currentSequence?: string

  handleData(data: proto.Data__Output) {
    // track sequence number for reconnecting later
    this.currentSequence = data.sequence
    if (!data.data?.value) {
      return
    }
    const block = Block.decode(data.data.value)
    console.log(`[data] blockNumber=${block.blockNumber}`)
  }

  handleInvalidate(invalidate: proto.Invalidate__Output) {
    console.log(`[invalidate] sequence=${invalidate.sequence}`)
    this.currentSequence = invalidate.sequence
  }

  onRetry(retryCount: number) {
    // retry connecting up to 3 times, with a delay of 5 seconds in between
    // retries.
    // Start from the sequence number _following_ the last received message.
    const retry = retryCount < 3
    const startingSequence = this.currentSequence ? +this.currentSequence + 1 : undefined

    console.log(`[retry] retry=${retry ? 'yes' : 'no'}, startingSequence=${startingSequence}`)

    return { retry, delay: 5, startingSequence }
  }
}

async function main() {
  const indexer = new AppIndexer()
  const node = new NodeClient('goerli.starknet.stream.apibara.com:443', credentials.createSsl())

  const messages = node.streamMessages(
    { startingSequence: 100_000 },
    {
      reconnect: true,
      onRetry: indexer.onRetry,
    }
  )

  return new Promise((resolve, reject) => {
    messages.on('end', resolve)
    messages.on('error', reject)
    messages.on('data', (msg: StreamMessagesResponse__Output) => {
      if (msg.data) {
        indexer.handleData(msg.data)
      } else if (msg.invalidate) {
        indexer.handleInvalidate(msg.invalidate)
      }
    })
  })
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
