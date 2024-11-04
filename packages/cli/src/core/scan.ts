import type { Apibara } from "apibara/types";
import fse from "fs-extra";
import { basename, join } from "pathe";

const INDEXER_EXTENSIONS = [".indexer.ts", ".indexer.js"];

export async function scanIndexers(apibara: Apibara) {
  apibara.logger.debug("Scanning indexers");

  const indexersDir = join(
    apibara.options.rootDir,
    apibara.options.indexersDir,
  );

  if (!fse.existsSync(indexersDir)) {
    throw new Error(`Indexers directory not found: ${indexersDir}`);
  }

  apibara.indexers = [];

  for (const file of fse.readdirSync(indexersDir)) {
    const indexerName = indexerNameFromFile(file);
    if (indexerName) {
      apibara.indexers.push({
        name: indexerName,
        indexer: join(indexersDir, file),
      });
    }
  }

  apibara.logger.debug(`Found ${apibara.indexers.length} indexers`);
}

function indexerNameFromFile(file: string) {
  for (const extension of INDEXER_EXTENSIONS) {
    if (file.endsWith(extension)) {
      return basename(file, extension);
    }
  }
}
