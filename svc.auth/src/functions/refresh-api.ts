import { err, ok } from "@dannywrayuk/results";
import { handler as refresh } from "./refresh.ts";
import { apiFunction } from "@dannywrayuk/service-platform/apiFunction";
import { getCookies } from "@dannywrayuk/aws/getCookies";
import { Env } from "../../generated/config.ts";

export const handler = apiFunction<Env>(async (request, { env }) => {
  const cookies = getCookies(request as { cookies: string[] }, ["refresh_token"] as const);
  if (!cookies.refresh_token) {
    return ok({
      statusCode: 400,
    });
  }

  const [response, error] = await refresh({
    refreshToken: cookies.refresh_token,
  });

  if (error) {
    if (error.name === "bad-request") {
      return ok({
        statusCode: 400,
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

