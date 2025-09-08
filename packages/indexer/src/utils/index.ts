import { useIndexerContext } from "../context";

export function reloadIndexer() {
  const context = useIndexerContext();
  context._reload = true;
}

export class ReloadIndexerRequest extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "ReloadIndexerRequest";
  }
}
