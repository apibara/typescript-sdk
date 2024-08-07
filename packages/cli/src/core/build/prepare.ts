import fsp from "node:fs/promises";
import type { Apibara } from "apibara/types";
import consola from "consola";
import fse from "fs-extra";

export async function prepare(apibara: Apibara) {
  await prepareDir(apibara.options.buildDir);
  await prepareDir(apibara.options.outputDir);
  consola.success("Output directory cleaned");
}

async function prepareDir(dir: string) {
  await fsp.mkdir(dir, { recursive: true });
  await fse.emptyDir(dir);
}
