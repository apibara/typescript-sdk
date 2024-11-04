import { fileURLToPath } from "node:url";

export const pkgDir = fileURLToPath(new URL(".", import.meta.url));

export const runtimeDir = fileURLToPath(
  new URL("dist/runtime/", import.meta.url),
);
