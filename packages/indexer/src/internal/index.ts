export function generateIndexerId(fileBasedName: string, identifier?: string) {
  return `indexer_${fileBasedName}_${identifier || "default"}`.replace(
    /[^a-zA-Z0-9_]/g,
    "_",
  );
}
