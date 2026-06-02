import { ok } from "@dannywrayuk/results";
import { apiFunction } from "@dannywrayuk/service-platform/apiFunction";
import { Env } from "../../generated/config.ts";

export const handler = apiFunction<Env>(async () => ok({
  statusCode: 200,
  body: {
    message: "👋",
  },
  headers: {
    "Cache-Control": "no-store",
    Pragma: "no-cache",
  },
  cookies: [
    `refresh_token=invalid; Max-Age=-1; Path=/refresh; HttpOnly; SameSite=None; Secure; Partitioned;`,
  ],
}));

