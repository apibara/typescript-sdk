import fsp from "node:fs/promises";
import fse from "fs-extra";
import type { Apibara } from "apibara/types";

export async function prepare(apibara: Apibara) {
  await prepareDir(apibara.options.outputDir);
}

async function prepareDir(dir: string) {
  await fsp.mkdir(dir, { recursive: true });
  await fse.emptyDir(dir);
}
