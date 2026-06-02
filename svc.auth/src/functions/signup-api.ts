import { err, ok } from "@dannywrayuk/results";
import { handler as signup } from "./signup.ts";
import { apiFunction } from "@dannywrayuk/service-platform/apiFunction";
import { Env } from "../../generated/config.ts";

export const handler = apiFunction<Env>(async (request, { env }) => {
  const [response, error] = await signup({
    code: request?.queryStringParameters?.code,
  });

  if (error) {
    if (error.name === "bad-request") {
      return ok({
        statusCode: 400,
      });
    }
    if (error.name === "already-exists") {
      return ok({
        statusCode: 409,
      });
    }
    return err(error);
  }

  return ok({
    statusCode: 200,
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
});
