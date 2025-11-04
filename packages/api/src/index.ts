import { z } from "zod";

type Options<O extends z.ZodType, I extends z.ZodType> = Omit<
  RequestInit,
  "method" | "body"
> & {
  validateInput?: I;
  validateOutput?: O;
};

export const fetcher = async <O extends z.ZodType, I extends z.ZodType>(
  method: string,
  url: string,
  body?: z.infer<I>,
  opts?: Options<O, I>,
): Promise<
  | {
      ok: boolean;
      status: number;
      headers: Headers;
      body: z.infer<O>;
    }
  | {
      ok: false;
      status: number;
      headers: Headers;
      body: object;
    }
> => {
  if (opts?.validateInput && body) {
    const validatedInput = opts.validateInput.safeParse(body);
    if (!validatedInput.success) {
      return {
        ok: false,
        status: 400,
        headers: new Headers(),
        body: { errors: validatedInput.error } as const,
      };
    }
    body = validatedInput.data as typeof body;
  }
  const options: RequestInit = {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
    ...(opts || {}),
  };
  const response = await fetch(url, options);
  const data = await response.json();
  if (opts?.validateOutput) {
    const validatedOutput = opts.validateOutput.safeParse(data);
    if (!validatedOutput.success) {
      return {
        ok: false,
        status: 500,
        headers: response.headers,
        body: { errors: validatedOutput.error } as const,
      };
    }
    return {
      ok: response.ok,
      status: response.status,
      headers: response.headers,
      body: validatedOutput.data,
    };
  }
  return {
    ok: response.ok,
    status: response.status,
    headers: response.headers,
    body: data,
  };
};

export const api = {
  get: <O extends z.ZodType, I extends z.ZodType>(
    url: string,
    opts?: Options<O, I>,
  ) => fetcher("GET", url, undefined, opts),
  post: <O extends z.ZodType, I extends z.ZodType>(
    url: string,
    body?: z.infer<I>,
    opts?: Options<O, I>,
  ) => fetcher("POST", url, body, opts),
};
