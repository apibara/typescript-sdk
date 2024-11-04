import fsp from "node:fs/promises";
import type { Apibara } from "apibara/types";
import fse from "fs-extra";
import { prettyPath } from "../path";

export async function prepare(apibara: Apibara) {
  await prepareDir(apibara.options.buildDir);
  await prepareDir(apibara.options.outputDir);

  apibara.logger.success(
    `Output directory ${prettyPath(apibara.options.outputDir)} cleaned`,
  );
}

async function prepareDir(dir: string) {
  await fsp.mkdir(dir, { recursive: true });
  await fse.emptyDir(dir);
}
