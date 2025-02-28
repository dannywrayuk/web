// This is an alternative to safe that completely ignores errors returns null instead of an error object.
// I'm not sure if this is useful, but it's here in case it's needed.
// The naming is not final.

export function safeIgnore<T extends (...args: any) => Promise<any>>(
  fn: T,
): (...input: Parameters<T>) => Promise<Awaited<ReturnType<T>> | null>;

export function safeIgnore<T extends (...args: any) => any>(
  fn: T,
): (...input: Parameters<T>) => ReturnType<T> | null;

export function safeIgnore<T extends (...args: any) => Promise<any>, F>(
  fn: T,
  fallback: F,
): (...input: Parameters<T>) => Promise<Awaited<ReturnType<T>> | F>;

export function safeIgnore<T extends (...args: any) => any, F>(
  fn: T,
  fallback: F,
): (...input: Parameters<T>) => ReturnType<T> | F;

export function safeIgnore<T extends (...args: any) => any, F>(
  fn: T,
  fallback?: F,
) {
  return (...input: Parameters<T>) => {
    const fallbackFallback = arguments.length === 2 ? fallback : null;
    try {
      const output = fn(...input);
      if (output instanceof Promise) {
        return output
          .then((data: Awaited<ReturnType<T>>) => data)
          .catch(() => fallbackFallback);
      }
      return output;
    } catch (error) {
      return fallbackFallback;
    }
  };
}
