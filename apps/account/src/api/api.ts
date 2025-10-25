const fetcher =
  (method: string) =>
  async (
    url: string,
    body?: object | null,
    opts?: Omit<RequestInit, "method" | "body">,
  ) => {
    const options: RequestInit = {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
      ...(opts || {}),
    };
    const response = await fetch(url, options);
    const data = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      headers: response.headers,
      body: data,
    };
  };

export const api = {
  get: fetcher("GET"),
  post: fetcher("POST"),
};
