import type esbuild from "esbuild";
import { isAbsolute, relative } from "pathe";
import type rollup from "rollup";

export function formatRollupError(
  _error: rollup.RollupError | esbuild.OnResolveResult,
) {
  try {
    const logs: string[] = [_error.toString()];
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const errors = (_error as any)?.errors || [_error as rollup.RollupError];
    for (const error of errors) {
      const id = error.path || error.id || (_error as rollup.RollupError).id;
      let path = isAbsolute(id) ? relative(process.cwd(), id) : id;
      const location =
        (error as rollup.RollupError).loc ||
        (error as esbuild.PartialMessage).location;
      if (location) {
        path += `:${location.line}:${location.column}`;
      }
      const text =
        (error as esbuild.PartialMessage).text ||
        (error as rollup.RollupError).frame;

      logs.push(
        // biome-ignore lint/style/useTemplate: <explanation>
        `Rollup error while processing \`${path}\`` + text ? "\n\n" + text : "",
      );
    }
    return logs.join("\n");
  } catch {
    return _error?.toString();
  }
}
