// Outputs when no fallback is provided:
function safeResult<T>(result: T) {
  return { result, error: null } as const;
}

function safeError<E>(error: E) {
  return { error } as const;
}

type SafeOutput<T, E> =
  | ReturnType<typeof safeResult<T>>
  | ReturnType<typeof safeError<E>>;

// Outputs when fallback is provided:

function safeFallback<T, E>(result: T, error: E) {
  return { result, error } as const;
}

type SafeOutputFallback<T, E, F> =
  | ReturnType<typeof safeResult<T>>
  | ReturnType<typeof safeFallback<F, E>>;

// When the input function is async and no fallback is provided:
export function safe<T extends (...args: any) => Promise<any>>(
  fn: T,
): <E extends Error = Error>(
  ...input: Parameters<T>
) => Promise<SafeOutput<Awaited<ReturnType<T>>, E>>;

// When the input function is not async and no fallback is provided:
export function safe<T extends (...args: any) => any>(
  fn: T,
): <E extends Error = Error>(
  ...input: Parameters<T>
) => SafeOutput<ReturnType<T>, E>;

// When the input function is async and a fallback is provided:
export function safe<T extends (...args: any) => Promise<any>, F>(
  fn: T,
  fallback?: F,
): <E extends Error = Error>(
  ...input: Parameters<T>
) => Promise<SafeOutputFallback<Awaited<ReturnType<T>>, E, F>>;

// When the input function is not async and a fallback is provided:
export function safe<T extends (...args: any) => any, F>(
  fn: T,
  fallback?: F,
): <E extends Error = Error>(
  ...input: Parameters<T>
) => SafeOutputFallback<ReturnType<T>, E, F>;

// Implementation:
export function safe<T extends (...args: any) => any, F>(fn: T, fallback?: F) {
  return <E extends Error = Error>(...input: Parameters<T>) => {
    const withFallback = arguments.length === 2;
    try {
      const output = fn(...input);
      if (output instanceof Promise) {
        return output
          .then((data: Awaited<ReturnType<T>>) => safeResult(data))
          .catch((error: E) =>
            withFallback ? safeFallback(fallback, error) : safeError(error),
          );
      }
      return safeResult(output);
    } catch (error) {
      return withFallback
        ? safeFallback(fallback, error as E)
        : safeError(error as E);
    }
  };
}
