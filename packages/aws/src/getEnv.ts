export const getEnv = <T>() =>
  ({
    ...process.env,
    ...((process.env.constants || {}) as unknown as object),
  }) as T;
