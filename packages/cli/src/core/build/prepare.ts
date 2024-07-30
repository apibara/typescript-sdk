import fsp from "node:fs/promises";
import type { Apibara } from "apibara/types";
import consola from "consola";
import fse from "fs-extra";

export async function prepare(apibara: Apibara) {
  consola.info("Cleaning output directory");
  await prepareDir(apibara.options.outputDir);
}

async function prepareDir(dir: string) {
  await fsp.mkdir(dir, { recursive: true });
  await fse.emptyDir(dir);
}
