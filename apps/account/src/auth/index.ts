import { fetcher } from "@dannywrayuk/api";
import { loginAPI, logoutAPI, refreshAPI } from "./api";
import z from "zod";

const authState = () => {
  let accessToken: string | null = null;
  let expiresAt: number | null = null;
  async function login(code: string) {
    const rsp = await loginAPI(code);
    if (!rsp) {
      return null;
    }
    accessToken = rsp.accessToken;
    expiresAt = Date.now() + rsp.expiresIn * 1000;
    localStorage.setItem("session", "true");
    return accessToken;
  }
  async function logout() {
    await logoutAPI();
    accessToken = null;
    expiresAt = null;
    localStorage.removeItem("session");
  }

  async function refresh() {
    if (expiresAt && Date.now() < expiresAt - 60 * 1000) {
      return;
    }
    const rsp = await refreshAPI();
    if (!rsp) {
      accessToken = null;
      expiresAt = null;
      localStorage.removeItem("session");
      return;
    }
    accessToken = rsp.accessToken;
    expiresAt = Date.now() + rsp.expiresIn * 1000;
  }
  async function getAccessToken() {
    await refresh();
    return accessToken;
  }

  type Options<O extends z.ZodType, I extends z.ZodType> = Omit<
    RequestInit,
    "method" | "body"
  > & {
    validateInput?: I;
    validateOutput?: O;
    retries?: number;
  };

  const authFetcher = async <O extends z.ZodType, I extends z.ZodType>(
    method: string,
    url: string,
    body?: z.infer<I>,
    opts: Options<O, I> = { headers: {}, retries: 1 },
  ): Promise<{
    ok: boolean;
    status: number;
    headers?: Headers;
    body: unknown;
  }> => {
    const token = await auth.getAccessToken();
    if (!token) {
      return {
        ok: false,
        status: 401,
        body: { error: "Unauthorized" },
      };
    }
    if (!(opts.headers as Record<string, string>)["authorization"]) {
      (opts.headers as Record<string, string>)["authorization"] =
        `Bearer ${token}`;
    }
    const rsp = await fetcher(method, url, body, opts);
    if (!rsp.ok) {
      if (opts?.retries === 0 || rsp.status !== 401) {
        return rsp;
      }
      console.warn("Request failed, refreshing token and retrying", rsp);
      return authFetcher(method, url, body, {
        ...opts,
        retries: (opts?.retries || 1) - 1,
      });
    }
    return rsp;
  };
  return {
    login,
    logout,
    getAccessToken,
    api: {
      get: <O extends z.ZodType, I extends z.ZodType>(
        url: string,
        opts?: Options<O, I>,
      ) => authFetcher("GET", url, undefined, opts),
      post: <O extends z.ZodType, I extends z.ZodType>(
        url: string,
        body?: z.infer<I>,
        opts?: Options<O, I>,
      ) => authFetcher("POST", url, body, opts),
    },
  };
};

export const auth = authState();
