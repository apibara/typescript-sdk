import { NodeClient, credentials } from '@apibara/protocol'

async function main() {
  const node = new NodeClient('goerli.starknet.stream.apibara.com:443', credentials.createSsl())
  const status = await node.status()
  console.log(status)
  console.log('start streaming')
  await node.streamMessages()
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
