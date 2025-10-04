import { ok } from "@dannywrayuk/responses";
import { env } from "./logout.gen";
import * as response from "@dannywrayuk/responses";

export const handler = async (event: any) => {
  if (
    !event.headers?.origin ||
    !env.allowedOrigins.includes(event.headers.origin)
  ) {
    return response.forbidden;
  }
  return ok("bye", {
    headers: {
      "Access-Control-Allow-Origin": event.headers.origin,
      "Access-Control-Allow-Credentials": "true",
    },
    cookies: [
      `refresh_token=invalid; Max-Age=-1; Path=/refresh; HttpOnly; SameSite=None; Secure;`,
    ],
  });
};
