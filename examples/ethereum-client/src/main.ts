import { toHex, pad, decodeEventLog } from 'viem'
import { StreamClient, v1alpha2, ChannelCredentials } from '@apibara/protocol'
import { H160, H256, EthereumCursor, Filter, v1alpha2 as ethereum } from '@apibara/ethereum'

// Grab Apibara DNA token from environment, if any.
const AUTH_TOKEN = process.env.AUTH_TOKEN

async function main() {
  console.log('Streaming all Uniswap V3 logs')

  const address = H160.fromBigInt('0x1F98431c8aD98523631AE4a59f267346ea31F984')

  const poolCreated = H256.fromBigInt(
    '0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118'
  )

  const poolCreatedAbi = [
    {
      name: 'PoolCreated',
      type: 'event',
      inputs: [
        {
          indexed: true,
          name: 'token0',
          type: 'address',
        },
        {
          indexed: true,
          name: 'token1',
          type: 'address',
        },
        {
          indexed: true,
          name: 'fee',
          type: 'uint24',
        },
        {
          indexed: false,
          name: 'tickSpacing',
          type: 'int24',
        },
        {
          indexed: false,
          name: 'pool',
          type: 'address',
        },
      ],
    },
  ] as const
  const filter = Filter.create()
    .withHeader({ weak: true, rlp: true })
    .addLog((log) => log.withAddress(address).withTopics([poolCreated]))
    .encode()

  const client = new StreamClient({
    url: 'localhost:7171',
    token: AUTH_TOKEN,
    credentials: ChannelCredentials.createInsecure(),
    clientOptions: {
      'grpc.max_receive_message_length': 128 * 1_048_576, // 128 MiB
    },
  })

  // const cursor = EthereumCursor.createWithBlockNumber(4734394)
  const cursor = EthereumCursor.createWithBlockNumber(6138789)

  client.configure({
    filter,
    batchSize: 2,
    finality: v1alpha2.DataFinality.DATA_STATUS_FINALIZED,
    cursor,
  })

  for await (const message of client) {
    if (message.data != null) {
      const batch = message.data?.data ?? []
      for (let item of batch) {
        const block = ethereum.Block.decode(item)
        const num = block.header?.blockNumber
        const logs = block.logs ?? []
        if (logs.length > 0) {
          console.log(`Block ${num}`)
          for (let log of logs) {
            const rawTopics = log.log?.topics ?? []
            const signature = toHex(H256.toBigInt(rawTopics[0]))
            const indexedTopics = rawTopics.slice(1).map((t) => pad(toHex(H256.toBigInt(t))))
            const data = toHex(log.log?.data ?? new Uint8Array())
            const decoded = decodeEventLog({
              abi: poolCreatedAbi,
              data,
              topics: [signature, ...indexedTopics],
            })
            console.log(decoded)
          }
        }
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
