export type Ok<T> = [T, null] | [T];
export type Err = [null, Error];
export type Result<T> = Ok<T> | Err;
export type AsyncResult<T> = Promise<Result<T>>;

export const ok = <T>(data: T): Ok<T> => [data, null];
export const err = (error?: Error | string, message?: string): Err => [
  null,
  error
    ? typeof error === "string"
      ? new Error(error)
      : message
        ? new Error([error.message, message].join("\n"))
        : error
    : new Error("Unknown error"),
];

export function unsafe<T extends () => Promise<any>>(
  fn: T,
): () => AsyncResult<Awaited<ReturnType<T>>>;
export function unsafe<T extends (...args: any[]) => Promise<any>>(
  fn: T,
): (...input: Parameters<T>) => AsyncResult<Awaited<ReturnType<T>>>;

export function unsafe<T extends () => any>(fn: T): () => Result<ReturnType<T>>;
export function unsafe<T extends (...args: any[]) => any>(
  fn: T,
): (...input: Parameters<T>) => Result<ReturnType<T>>;

export function unsafe<T extends (...args: any[]) => any>(fn: T) {
  return (...input: Parameters<T>) => {
    try {
      const result = fn(...input);
      if (result instanceof Promise) {
        return result
          .then((data) => ok(data as Awaited<ReturnType<T>>))
          .catch((error) => err(error as Error));
      }
      return ok(result as ReturnType<T>);
    } catch (error) {
      return err(error as Error);
    }
  };
}

export function unsafeSync<T extends (...args: any[]) => any>(
  fn: T,
): (...input: Parameters<T>) => Result<ReturnType<T>>;
export function unsafeSync<T extends () => any>(
  fn: T,
): () => Result<ReturnType<T>>;
export function unsafeSync<T extends (...args: any[]) => any>(fn: T) {
  return (...input: Parameters<T>) => {
    try {
      return ok(fn(...input));
    } catch (error) {
      return err(error as Error);
    }
  };
}
