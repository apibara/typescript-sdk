import type { IndexerContext } from "../context";

export function useSink<TTxnParams>({
  context,
}: {
  context: IndexerContext<TTxnParams>;
}) {
  if (!context.sinkTransaction) {
    throw new Error("Transaction context doesn't exist!");
  }

  return context.sinkTransaction;
}
