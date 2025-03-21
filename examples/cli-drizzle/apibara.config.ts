import { defineConfig } from "apibara/config";

export default defineConfig({
  runtimeConfig: {
    evm: {
      startingBlock: 215_30_000,
    },
    starknet: {
      startingBlock: 12_45_000,
    },
  },
});
