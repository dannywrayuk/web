import * as response from "@dannywrayuk/responses";
import { authorizationCode } from "./lib/authorizationCode";
import { refreshTokens } from "./lib/refreshTokens";
import { err, ok, unsafeSync } from "@dannywrayuk/results";
import { createUsersEntry, env, getSecrets, readUsersEntry } from "./token.gen";
import * as userActions from "./lib/actions/userActions";
import * as githubActions from "./lib/actions/githubActions";
import { generateToken, verifyToken } from "./lib/actions/tokenActions";

export const handler = async (event: any) => {
  const secrets = await getSecrets();
  const headers = event.headers;
  const contentType = headers["Content-Type"] || headers["content-type"];

  const [body, bodyError] = (() => {
    if (!event.body) {
      return err("no body");
    }
    if (contentType === "application/json") {
      return unsafeSync(JSON.parse)(event.body);
    }
    if (contentType === "application/x-www-form-urlencoded") {
      const decoded = event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf8")
        : event.body;
      return ok(Object.fromEntries(new URLSearchParams(decoded)));
    }
    return err(`unsupported content type: ${contentType}`);
  })();

  if (bodyError) {
    return response.badRequest(bodyError.message);
  }
  if (!body.grant_type) {
    return response.badRequest("Missing grant_type");
  }

  if (body.grant_type == "authorization_code") {
    const currentTime = new Date().toISOString();

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
    })(body);

    if (tokenError) {
      return response.badRequest(tokenError.message);
    }
    return response.ok(
      {
        ...tokens,
        token_type: "Bearer",
        expires_in: env.authTokenTimeouts.accessToken,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
      },
    );
  }
  if (body.grant_type === "refresh_token") {
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
    })(body);

    if (tokenError) {
      return response.error(tokenError.message);
    }
    return response.ok(
      {
        ...tokens,
        token_type: "Bearer",
        expires_in: env.authTokenTimeouts.accessToken,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
      },
    );
  }

  return response.badRequest("Invalid grant_type");
};
