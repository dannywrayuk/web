import { callable } from "@dannywrayuk/service-platform/callable";
import { serviceName } from "./config.ts";
import { z } from "zod";

export const login = callable(serviceName, {
  name: "login",
  request: z.object({ code: z.string() }),
  response: z.object({ accessToken: z.string(), refreshToken: z.string() }),
  secrets: [
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "AUTH_ACCESS_TOKEN_SIGNING_KEY",
    "AUTH_REFRESH_TOKEN_SIGNING_KEY",
  ] as const,
  callers: ["auth-token"],
  hasApi: true,
});

export const refresh = callable(serviceName, {
  name: "refresh",
  request: z.object({ code: z.string() }),
  secrets: [
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "AUTH_ACCESS_TOKEN_SIGNING_KEY",
    "AUTH_REFRESH_TOKEN_SIGNING_KEY",
  ],
});

export const logout = callable(serviceName, {
  name: "logout",
});
