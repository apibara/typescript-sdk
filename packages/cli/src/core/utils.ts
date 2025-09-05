export function reloadIndexer() {
  throw new ReloadIndexerRequest();
}

export class ReloadIndexerRequest extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "ReloadIndexerRequest";
  }
}
