import fs from "node:fs";
import path from "node:path";
import type { VcrConfig } from "./config";

export function deserialize(str: string) {
  return JSON.parse(str, (_, value) =>
    typeof value === "string" && value.match(/^\d+n$/)
      ? BigInt(value.slice(0, -1))
      : value,
  );
}

export function serialize(obj: Record<string, unknown>): string {
  return JSON.stringify(
    obj,
    (_, value) => (typeof value === "bigint" ? `${value.toString()}n` : value),
    "\t",
  );
}

export function isCassetteAvailable(
  vcrConfig: VcrConfig,
  cassetteName: string,
): boolean {
  const filePath = path.join(vcrConfig.cassetteDir, `${cassetteName}.json`);
  return fs.existsSync(filePath);
}
