/* eslint-disable @typescript-eslint/no-explicit-any */
export type Ok<T> = [T, null] | [T];
type ErrorObject = {
  name: string;
  message: string;
  stack?: string;
};
export type Err = [null, ErrorObject];
export type Result<T> = Ok<T> | Err;

const errorObject = (error: Error): ErrorObject => ({
  name: error.name,
  message: error.message,
  stack: error.stack,
});

export const ok = <T>(data: T): Ok<T> => [data, null];
export const err = (
  error?: ErrorObject | null,
  message?: string,
  name?: string,
): Err => {
  const e: ErrorObject = error
    ? errorObject(error)
    : { name: "Error", message: "An unknown error occurred" };
  if (message) {
    e.message = [e.message, message].join("\n");
  }
  if (name) {
    e.name = name;
  }
  return [null, e];
};

export function unsafe<T extends () => Promise<any>>(
  fn: T,
): () => Promise<Result<Awaited<ReturnType<T>>>>;
export function unsafe<T extends (...args: any[]) => Promise<any>>(
  fn: T,
): (...input: Parameters<T>) => Promise<Result<Awaited<ReturnType<T>>>>;

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
