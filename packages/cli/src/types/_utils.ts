// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type DeepPartial<T> = T extends Record<string, any>
  ? { [P in keyof T]?: DeepPartial<T[P]> | T[P] }
  : T;
