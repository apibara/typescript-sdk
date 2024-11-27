import { EvmStream } from "@apibara/evm";
import { defineIndexer } from "@apibara/indexer";

export default defineIndexer(EvmStream)({
  streamUrl: "http://localhost:7007",
  finality: "accepted",
  filter: {
    header: "always",
  },
  async transform({ cursor, endCursor }) {
    console.log({ cursor, endCursor });
  },
  hooks: {
    "message:invalidate"({ message }) {
      console.warn(message);
    },
  },
});
