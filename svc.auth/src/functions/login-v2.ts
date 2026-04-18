import { authorizationCode } from "./lib/authorizationCode.ts";
import * as githubActions from "./lib/actions/githubActions.ts";
import { generateToken } from "./lib/actions/tokenActions.ts";
import {
  createUserExternalLink,
  createUserRecord,
  readUserExternalLink,
  UserRecord,
} from "@dannywrayuk/schema/database/users";
import { err, ok } from "@dannywrayuk/results";
import { handlerFunction } from "@dannywrayuk/service-platform/handlerFunction";
import { login } from "../../interface.ts";
import type { Env } from "../../generated/config.ts";

export const handler = handlerFunction<Env>()(
  login,
  async (event, { secrets, env, timestamp }) => {
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
          { sub: userId, iss: env.domainName, sessionStarted: timestamp },
          {
            signingKey: secrets.AUTH_ACCESS_TOKEN_SIGNING_KEY,
            timeout: env.authTokenTimeouts.accessToken,
          },
        ),
      refreshToken: (userId) =>
        generateToken(
          { sub: userId, iss: env.domainName, sessionStarted: timestamp },
          {
            signingKey: secrets.AUTH_REFRESH_TOKEN_SIGNING_KEY,
            timeout: env.authTokenTimeouts.refreshToken,
          },
        ),
    })({ code: event.code });

    if (tokenError) {
      return err(tokenError.message, "Error generating tokens");
    }

    return ok({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    });
  },
);
