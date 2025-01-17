import fs from "node:fs";
import path from "node:path";

export const emptyBlock = new Uint8Array();
export const largeBlock = readHexFile("./fixtures/large-block.txt");

function readHexFile(f: string): Uint8Array {
  const filename = path.join(import.meta.dirname, f);
  const hex = fs.readFileSync(filename, "utf-8");
  return fromHex(hex);
}

function fromHex(hex: string): Uint8Array {
  return Uint8Array.from(Buffer.from(hex, "hex"));
}
