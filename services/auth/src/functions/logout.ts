import { ok } from "@dannywrayuk/responses";
import { env } from "./logout.gen";
import * as response from "@dannywrayuk/responses";
import { logger } from "@dannywrayuk/logger";

export const handler = async (event: any) => {
  logger
    .setDebug(env.stage === "dev")
    .attach({
      name: env.functionName,
      service: env.serviceName,
      stage: env.stage,
    })
    .debug("input", {
      headers: event.headers,
    })
    .info("start");

  if (
    !event.headers?.origin ||
    !env.allowedOrigins.includes(event.headers.origin)
  ) {
    return response.forbidden();
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
