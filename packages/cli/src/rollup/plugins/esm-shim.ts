import MagicString from "magic-string";
import type { Plugin } from "rollup";

/**
 * An alternative to @rollup/plugin-esm-shim
 */
export function esmShim(): Plugin {
  const ESMShim = `
// -- Shims --
import cjsUrl from 'node:url';
import cjsPath from 'node:path';
const __filename = cjsUrl.fileURLToPath(import.meta.url);
const __dirname = cjsPath.dirname(__filename);
// -- End Shims --
`;

  const CJSyntaxRegex = /__filename|__dirname/;

  return {
    name: "esm-shim",

    renderChunk(code, _chunk, opts) {
      if (opts.format === "es") {
        if (code.includes(ESMShim) || !CJSyntaxRegex.test(code)) {
          return null;
        }

        let endIndexOfLastImport = -1;

        // Find the last import statement and its ending index
        for (const match of code.matchAll(/^import\s.*';$/gm)) {
          if (match.length === 0 || typeof match.index !== "number") {
            continue;
          }

          endIndexOfLastImport = match.index + match[0].length;
        }

        const s = new MagicString(code);
        s.appendRight(endIndexOfLastImport, ESMShim);

        const sourceMap = s.generateMap({
          includeContent: true,
        });

        let sourcesContent: string[] | undefined;
        if (Array.isArray(sourceMap.sourcesContent)) {
          sourcesContent = [];
          for (let i = 0; i < sourceMap.sourcesContent.length; i++) {
            const content = sourceMap.sourcesContent[i];
            if (typeof content === "string") {
              sourcesContent.push(content);
            }
          }
        }

        return {
          code: s.toString(),
          map: {
            ...sourceMap,
            sourcesContent,
          },
        };
      }

      return null;
    },
  };
}
