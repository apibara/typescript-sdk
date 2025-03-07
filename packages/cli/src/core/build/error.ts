import { isAbsolute, relative } from "pathe";
import type * as rolldown from "rolldown";

export function formatRolldownError(_error: rolldown.RollupError) {
  try {
    const logs: string[] = [_error.toString()];
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const errors = (_error as any)?.errors || [_error as rolldown.RollupError];
    for (const error of errors) {
      const id = error.path || error.id || (_error as rolldown.RollupError).id;
      let path = isAbsolute(id) ? relative(process.cwd(), id) : id;
      const location = (error as rolldown.RollupError).loc;
      if (location) {
        path += `:${location.line}:${location.column}`;
      }
      const text = (error as rolldown.RollupError).frame;

      logs.push(
        `Rolldown error while processing \`${path}\`` + text
          ? "\n\n" + text
          : "",
      );
    }
    return logs.join("\n");
  } catch {
    return _error?.toString();
  }
}
