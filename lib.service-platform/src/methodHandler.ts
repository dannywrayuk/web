/* eslint-disable @typescript-eslint/no-explicit-any */
export const methodHandler = (
  handler: (event: any, context: any) => any,
  validateInput: (o: any) => any,
  validateOutput: (o: any) => any,
) => {
  return validateOutput({});
};

export type HandlerContext<
  Env extends Record<string, unknown>,
  S extends Record<string, string>,
> = {
  secrets: S;
  env: Env;
  timestamp: string;
};
