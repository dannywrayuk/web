type SafeOutput<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

export function safely<T extends (...args: any) => Promise<any>>(
  fn: T,
): <E extends Error = Error>(
  ...input: Parameters<T>
) => Promise<SafeOutput<Awaited<ReturnType<T>>, E>>;

export function safely<T extends (...args: any) => any>(
  fn: T,
): <E extends Error = Error>(
  ...input: Parameters<T>
) => SafeOutput<ReturnType<T>, E>;

export function safely<T extends (...args: any) => any>(fn: T) {
  return <E extends Error = Error>(
    ...input: Parameters<T>
  ):
    | SafeOutput<ReturnType<T>, E>
    | Promise<SafeOutput<Awaited<ReturnType<T>>, E>> => {
    try {
      const output = fn(...input);
      if (output instanceof Promise) {
        return output
          .then(
            (data: Awaited<ReturnType<T>>) =>
              ({ success: true, data }) as const,
          )
          .catch((error: E) => ({ success: false, error }) as const);
      }
      return { success: true, data: output } as const;
    } catch (error) {
      return { success: false, error: error as E } as const;
    }
  };
}
