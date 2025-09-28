import { authorizationCode } from "./lib/authorizationCode";
import { env, getSecrets, readUsersEntry, createUsersEntry } from "./login.gen";
import * as response from "./lib/response";
import * as userActions from "./lib/userActions";
import * as githubActions from "./lib/githubActions";
import { generateToken } from "./lib/tokenActions";

export const handler = async (event: any) => {
  const secrets = await getSecrets();

  const currentTime = new Date().toISOString();

  if (!event.queryStringParameters?.code) {
    return response.badRequest("Missing code");
  }

  if (
    !event.headers?.origin ||
    !env.allowedOrigins.includes(event.headers.origin)
  ) {
    return response.forbidden;
  }

  const [tokens, tokenError] = await authorizationCode({
    getExternalAccessToken: githubActions.getAccessToken({
      clientId: secrets.GITHUB_CLIENT_ID,
      clientSecret: secrets.GITHUB_CLIENT_SECRET,
      githubOAuthUrl: env.githubUrl,
      requiredScopes: ["read:user", "user:email"],
    }),
    findUserIdByExternalId: userActions.findUserIdByExternalId({
      readUsersEntry,
      externalName: "GITHUB",
    }),
    createUser: userActions.createUser({
      createUsersEntry,
      externalName: "GITHUB",
    }),
    getUserInfo: githubActions.getUserInfo({
      githubApiUrl: env.githubApiUrl,
    }),
    getPrimaryEmail: githubActions.getPrimaryEmail({
      githubApiUrl: env.githubApiUrl,
    }),
    accessToken: (userId) =>
      generateToken(
        { sub: userId, iss: env.domainName, sessionStarted: currentTime },
        {
          signingKey: secrets.AUTH_ACCESS_TOKEN_SIGNING_KEY,
          timeout: env.authTokenTimeouts.accessToken,
        },
      ),
    refreshToken: (userId) =>
      generateToken(
        { sub: userId, iss: env.domainName, sessionStarted: currentTime },
        {
          signingKey: secrets.AUTH_REFRESH_TOKEN_SIGNING_KEY,
          timeout: env.authTokenTimeouts.refreshToken,
        },
      ),
  })(event.queryStringParameters);

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
