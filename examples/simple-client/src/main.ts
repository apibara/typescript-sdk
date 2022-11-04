import { node } from '@apibara/protocol'

async function main() {
  console.log(node.v1alpha1.Node)
  console.log('Hello, World')
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
