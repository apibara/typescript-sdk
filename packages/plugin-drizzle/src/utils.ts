export class DrizzleStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DrizzleStorageError";
  }
}
