import { ok } from "@dannywrayuk/responses";
import { env } from "./logout.gen.ts";
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

  return ok("bye", {
    cookies: [
      `refresh_token=invalid; Max-Age=-1; Path=/refresh; HttpOnly; SameSite=None; Secure; Partitioned;`,
    ],
  });
};
