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
  presets: {
    mainnet: {
      runtimeConfig: {
        evm: {
          startingBlock: 215_30_000,
        },
        starknet: {
          startingBlock: 12_45_000,
        },
      },
    },
    testnet: {
      runtimeConfig: {
        evm: {
          startingBlock: 80_60_000,
        },
        starknet: {
          startingBlock: 6_60_000,
        },
      },
    },
  },
});
