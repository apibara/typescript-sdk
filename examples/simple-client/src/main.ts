import Decimal from 'decimal.js'
import { StreamClient, Cursor, v1alpha2 } from '@apibara/protocol'
import { StarkNetCursor, Filter, FieldElement, v1alpha2 as starknet } from '@apibara/starknet'
import { hash } from 'starknet'

const ETH_DECIMALS = 18

function toDecimalAmount(amount: bigint): Decimal {
  const num = new Decimal(amount.toString(10))
  const dec = new Decimal(10).pow(ETH_DECIMALS)
  return num.div(dec)
}

const ADDR_BOUND = 2n ** 251n - 256n

function storageVarAddress(name: string, args: bigint[]): bigint {
  let acc = hash.getSelectorFromName(name)
  for (let arg of args) {
    acc = hash.pedersen([acc, '0x' + arg.toString(16)])
  }
  let res = BigInt(acc)
  while (res > ADDR_BOUND) {
    res -= ADDR_BOUND
  }
  return res
}

async function main() {
  console.log('Streaming all Transfer events for ETH')

  // Encode address to the wire format.
  const address = FieldElement.fromBigInt(
    '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'
  )

  const transfer_key = [FieldElement.fromBigInt(hash.getSelectorFromName('Transfer'))]

  // Create stream filter. The client will only receive the specified data.
  //
  // - events: all transfer events from the eth contract
  // - state update: all storage diffs from the eth contract
  const filter = Filter.create()
    .withHeader()
    .addEvent((ev) => ev.withFromAddress(address).withKeys(transfer_key))
    .withStateUpdate((su) => su.addStorageDiff((st) => st.withContractAddress(address)))
    .encode()

  const client = new StreamClient({
    url: 'mainnet.starknet.a5a.ch',
    clientOptions: {
      'grpc.max_receive_message_length': 128 * 1_048_576, // 128 MiB
    },
  })

  // Starting block. Here we specify the block hash but it's not
  // necessary since the block has been finalized.
  const cursor = StarkNetCursor.createWithBlockNumberAndHash(
    1045,
    FieldElement.fromBigInt('0x0692649d9ed2b866d241f4fb573be91882c88d09fbcbc3c2377e9f74c43f34dd')
  )

  client.configure({
    filter,
    batchSize: 10,
    finality: v1alpha2.DataFinality.DATA_STATUS_FINALIZED,
    cursor,
  })

  for await (const message of client) {
    if (message.data?.data) {
      console.log(
        `Batch: ${Cursor.toString(message.data.cursor)} -- ${Cursor.toString(
          message.data.endCursor
        )}`
      )
      for (let item of message.data.data) {
        const block = starknet.Block.decode(item)

        // we will use direct storage access to compute the users' new
        // balances without making an (expensive) RPC call.
        const storageMap = new Map<bigint, bigint>()
        const storageDiffs = block.stateUpdate?.stateDiff?.storageDiffs ?? []
        for (let diff of storageDiffs) {
          for (let entry of diff.storageEntries ?? []) {
            if (!entry.key || !entry.value) {
              continue
            }
            const key = FieldElement.toBigInt(entry.key)
            const value = FieldElement.toBigInt(entry.value)
            storageMap.set(key, value)
          }
        }

        for (let { transaction, event } of block.events) {
          const hash = transaction?.meta?.hash
          if (!event || !event.data || !hash) {
            continue
          }

          const from = FieldElement.toBigInt(event.data[0])
          const to = FieldElement.toBigInt(event.data[1])
          const amount = toDecimalAmount(
            FieldElement.toBigInt(event.data[2]) + (FieldElement.toBigInt(event.data[3]) << 128n)
          )

          const fromBalanceLoc = storageVarAddress('ERC20_balances', [from])
          const fromBalance = storageMap.get(fromBalanceLoc) ?? BigInt(0)

          const toBalanceLoc = storageVarAddress('ERC20_balances', [to])
          const toBalance = storageMap.get(toBalanceLoc) ?? BigInt(0)
          console.log(`T 0x${from.toString(16)} => 0x${to.toString(16)}`)
          console.log(`             Amount: ${amount.toString()} ETH`)
          console.log(`  New Balance(from): ${toDecimalAmount(fromBalance)} ETH`)
          console.log(`  New Balance(  to): ${toDecimalAmount(toBalance)} ETH`)
          console.log(`  Transaction  Hash: ${FieldElement.toHex(hash)}`)
        }
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
