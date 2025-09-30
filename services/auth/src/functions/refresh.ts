import { refreshTokens } from "./lib/refreshTokens";
import { generateToken, verifyToken } from "./lib/actions/tokenActions";
import { getSecrets, env, readUsersEntry } from "./refresh.gen";
import * as response from "@dannywrayuk/responses";
import * as userActions from "./lib/actions/userActions";
import { getCookies } from "@dannywrayuk/aws/getCookies";

export const handler = async (event: any) => {
  const secrets = await getSecrets();
  const cookies = getCookies(event, ["refresh_token"] as const);

  if (
    !event.headers?.origin ||
    !env.allowedOrigins.includes(event.headers.origin) ||
    !cookies.refresh_token
  ) {
    return response.forbidden;
  }

  const [tokens, tokenError] = await refreshTokens({
    accessToken: (userId, sessionStarted) =>
      generateToken(
        { sub: userId, iss: env.domainName, sessionStarted },
        {
          signingKey: secrets.AUTH_ACCESS_TOKEN_SIGNING_KEY,
          timeout: env.authTokenTimeouts.accessToken,
        },
      ),
    refreshToken: (userId, sessionStarted) =>
      generateToken(
        { sub: userId, iss: env.domainName, sessionStarted },
        {
          signingKey: secrets.AUTH_REFRESH_TOKEN_SIGNING_KEY,
          timeout: env.authTokenTimeouts.refreshToken,
        },
      ),
    verifyRefreshToken: (token: string) =>
      verifyToken(token, secrets.AUTH_REFRESH_TOKEN_SIGNING_KEY),
    findUserById: userActions.findUserById({ readUsersEntry }),
  })({ refresh_token: cookies.refresh_token });

  if (tokenError) {
    return response.error(tokenError.message);
  }
  return response.ok(
    {
      access_token: tokens.access_token,
      token_type: "Bearer",
      expires_in: env.authTokenTimeouts.accessToken,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": event.headers.origin,
        "Access-Control-Allow-Credentials": "true",
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
      cookies: [
        `refresh_token=${tokens.refresh_token}; Max-Age=${env.authTokenTimeouts.refreshToken}; Path=/refresh; HttpOnly; SameSite=None; Secure;`,
      ],
    },
  );
};
