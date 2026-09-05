export type HandlerContext<
  E extends Record<string, unknown> = Record<string, unknown>,
  S extends readonly string[] = [],
> = {
  secrets: Record<S[number], string>;
  env: E;
  timestamp: string;
};
