import { authorizationCode } from "./lib/authorizationCode";
import { env, getSecrets, readUsersEntry, createUsersEntry } from "./login.gen";
import * as response from "@dannywrayuk/responses";
import * as userActions from "./lib/actions/userActions";
import * as githubActions from "./lib/actions/githubActions";
import { generateToken } from "./lib/actions/tokenActions";
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
      queryParams: event.queryStringParameters,
      headers: event.headers,
    })
    .info("start");

  const secrets = await getSecrets();
  const currentTime = new Date().toISOString();

  if (!event.queryStringParameters?.code) {
    return response.badRequest("Missing code");
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
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
      cookies: [
        `refresh_token=${tokens.refresh_token}; Max-Age=${env.authTokenTimeouts.refreshToken}; Path=/refresh; HttpOnly; SameSite=None; Secure;`,
      ],
    },
  );
};
