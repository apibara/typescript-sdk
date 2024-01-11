import { StreamClient } from "@apibara/protocol";
import { Filter, StarkNetCursor, v1alpha2 } from "@apibara/starknet";

async function main() {
  const client = new StreamClient({
    url: "sepolia.starknet.a5a.ch",
    token: process.env.DNA_TOKEN,
    async onReconnect(err, retryCount) {
      console.log("reconnect", err, retryCount);
      // Sleep for 1 second before retrying.
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { reconnect: true };
    }
  })

  const filter = Filter.create().withHeader({ weak: false }).encode();

  client.configure({
    filter,
    batchSize: 1,
    cursor: StarkNetCursor.createWithBlockNumber(18_000),
  })

  for await (const message of client) {
    switch (message.message) {
      case "data": {
        if (!message.data?.data) {
          continue;
        }
        for (const data of message.data.data) {
          const block = v1alpha2.Block.decode(data);
          const { header } = block;
          if (!header) {
            continue;
          }
          console.log("Block " + header.blockNumber?.toString());
        }
        break;
      }
      case "invalidate": {
        break;
      }
      case "heartbeat": {
        console.log("Received heartbeat");
        break;
      }
    }
  }
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
