import * as response from "@dannywrayuk/responses";
import { authorizationCode } from "./lib/authorizationCode.ts";
import { refreshTokens } from "./lib/refreshTokens.ts";
import { err, ok, unsafeSync } from "@dannywrayuk/results";
import { env, getSecrets, usersTable } from "./token.gen.ts";
import * as githubActions from "./lib/actions/githubActions.ts";
import { generateToken, verifyToken } from "./lib/actions/tokenActions.ts";
import { logger } from "@dannywrayuk/logger";
import {
  createUserExternalLink,
  createUserRecord,
  readUserExternalLink,
  readUserRecord,
  UserRecord,
} from "@dannywrayuk/schema/database/users";

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
      body: event.body,
    })
    .info("start");

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

  logger.debug("body", body);

  if (!body.grant_type) {
    return response.badRequest("Missing grant_type");
  }

  if (body.grant_type == "authorization_code") {
    logger.info("authorization_code");
    const currentTime = new Date().toISOString();

    const [tokens, tokenError] = await authorizationCode({
      getExternalAccessToken: githubActions.getAccessToken({
        clientId: secrets.GITHUB_CLIENT_ID,
        clientSecret: secrets.GITHUB_CLIENT_SECRET,
        githubOAuthUrl: env.githubUrl,
        requiredScopes: ["read:user", "user:email"],
      }),
      findUserByExternalLink: (id: string) =>
        readUserExternalLink(usersTable)({
          externalName: "GITHUB",
          externalId: id,
        }),
      createUser: async (userRecord: UserRecord & { EXTERNAL_ID: string }) => {
        const { EXTERNAL_ID, ...userData } = userRecord;
        const [, createUserError] = await createUserRecord(usersTable)({
          ...userData,
          GITHUB_ID: EXTERNAL_ID,
        });
        if (createUserError) {
          return err(createUserError);
        }
        const [, createLinkError] = await createUserExternalLink(usersTable)({
          externalName: "GITHUB",
          userId: userData.USER_ID,
          externalId: EXTERNAL_ID,
        });
        if (createLinkError) {
          return err(createLinkError);
        }
        return ok(userData.USER_ID);
      },
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
    logger.info("refresh_token");
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
      findUserById: readUserRecord(usersTable),
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
