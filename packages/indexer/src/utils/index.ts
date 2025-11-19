import { useIndexerContext } from "../context";

export function reloadIndexer() {
  const context = useIndexerContext();
  context._reload = true;
}

export function reloadIfNeeded() {
  const context = useIndexerContext();
  if (context._reload) {
    context._reload = false;
    throw new ReloadIndexerRequest();
  }
}

export class ReloadIndexerRequest extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "ReloadIndexerRequest";
  }
}
