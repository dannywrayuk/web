import { ok } from "@dannywrayuk/results";
import { handler as loginHandler } from "./login-v2.ts";
import { apiFunction } from "@dannywrayuk/service-platform/apiFunction";
import { login } from "../../handlers.ts";
import { Env } from "../../generated/config.ts";

export const handler = apiFunction<Env>()(login, loginHandler, {
  request: (request) => {
    return ok({
      code: request?.queryStringParameters?.code,
    });
  },
  response: (response, { env }) => {
    return ok({
      body: {
        access_token: response.accessToken,
        token_type: "Bearer",
        expires_in: env.authTokenTimeouts.accessToken,
      },
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
      cookies: [
        `refresh_token=${response.refreshToken}; Max-Age=${env.authTokenTimeouts.refreshToken}; Path=/refresh; HttpOnly; SameSite=None; Secure; Partitioned;`,
      ],
    });
  },
  error: () => {
    return {
      statusCode: 500,
    };
  },
});
