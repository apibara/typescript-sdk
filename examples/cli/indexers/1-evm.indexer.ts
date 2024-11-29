import { EvmStream } from "@apibara/evm";
import { defineIndexer } from "@apibara/indexer";
import { useLogger } from "@apibara/indexer/plugins/logger";

export default defineIndexer(EvmStream)({
  streamUrl: "https://ethereum.preview.apibara.org",
  finality: "accepted",
  startingCursor: {
    orderKey: 10_000_000n,
  },
  filter: {
    header: "always",
    transactions: [{}],
  },
  async transform({ endCursor }) {
    const logger = useLogger();
    logger.info("Transforming block ", endCursor?.orderKey);
  },
});
