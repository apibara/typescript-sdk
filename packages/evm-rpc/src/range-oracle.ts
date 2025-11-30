const BLOCK_RANGE_ERROR_PATTERNS = ["invalid block range params"] as const;

export type BlockRange = {
  start: bigint;
  end: bigint;
};

export type BlockRangeOracle = {
  clampRange(original: BlockRange): BlockRange;
  handleSuccess(): void;
  handleError(error: unknown): { retry: boolean };
};

export function createBlockRangeOracle({
  startingSize,
  minSize = 1n,
  maxSize = 10_000n,
}: {
  startingSize: bigint;
  minSize?: bigint;
  maxSize?: bigint;
}): BlockRangeOracle {
  let currentSize = startingSize;

  return {
    clampRange(original: BlockRange): BlockRange {
      const start = original.start;
      let end = original.end;

      const newEnd = start + currentSize - 1n;
      if (newEnd < end) {
        end = newEnd;
      }

      return { start, end };
    },
    handleSuccess(): void {
      // TODO: we can track how many successful requests and increase the size.
      // Probably want to receive the number of logs as argument and have a "target"
    },
    handleError(error: unknown): { retry: boolean } {
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        const isBlockRangeError = BLOCK_RANGE_ERROR_PATTERNS.some((pattern) =>
          message.includes(pattern),
        );

        if (isBlockRangeError) {
          if (currentSize > minSize) {
            const newSize = currentSize / 2n;
            currentSize = newSize > minSize ? newSize : minSize;
          }

          return { retry: true };
        }
      }

      return { retry: false };
    },
  };
}
