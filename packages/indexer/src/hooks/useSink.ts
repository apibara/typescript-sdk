import type { IndexerContext } from "../context";

export function useSink<TTxnParams>({
  context,
}: {
  context: IndexerContext<TTxnParams>;
}) {
  return context.sinkTransaction;
}
