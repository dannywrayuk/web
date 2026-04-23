import { serviceFunction } from "@dannywrayuk/service-platform/serviceFunction";
import { login } from "../../service.ts";
import type { Env } from "../../generated/config.ts";
import { getAccessToken } from "@dannywrayuk/github/getAccessToken";
import { err, ok } from "@dannywrayuk/results";
import { getUserInfo } from "@dannywrayuk/github/getUserInfo";
import { usersListBy_githubId } from "../../generated/users-table.ts";
import { signToken } from "@dannywrayuk/jwt";

export const handler = serviceFunction<Env>()(
  login,
  async (event, { secrets, env, timestamp }) => {
    const [accessTokenResponse, accessTokenResponseError] =
      await getAccessToken({
        code: event.code,
        clientId: secrets.GITHUB_CLIENT_ID,
        clientSecret: secrets.GITHUB_CLIENT_SECRET,
        githubOAuthUrl: env.githubUrl,
      });

    if (accessTokenResponseError) {
      return err(accessTokenResponseError, "getting access token");
    }

    const [userInfoResponse, userInfoResponseError] = await getUserInfo({
      accessToken: accessTokenResponse.access_token,
      githubApiUrl: env.githubApiUrl,
    });

    if (userInfoResponseError) {
      return err(userInfoResponseError, "getting user info");
    }

    const [userIds, userIdError] = await usersListBy_githubId(
      userInfoResponse.EXTERNAL_ID,
    );

    if (userIdError) {
      return err(userIdError, "getting user id from github id");
    }
    if (userIds.length === 0) {
      return err("no user found with github id", "not found");
    }
    if (userIds.length > 1) {
      return err("multiple users found with github id", "data integrity error");
    }
    const userId = userIds[0].userId;

    const [accessToken, accessTokenError] = signToken(
      {
        sub: userId,
        iss: env.domainName,
        started: timestamp,
      },
      {
        signingKey: secrets.AUTH_ACCESS_TOKEN_SIGNING_KEY,
        timeout: env.authTokenTimeouts.accessToken,
      },
    );

    if (accessTokenError) {
      return err(accessTokenError, "signing access token");
    }

    const [refreshToken, refreshTokenError] = signToken(
      {
        sub: userId,
        iss: env.domainName,
        started: timestamp,
      },
      {
        signingKey: secrets.AUTH_REFRESH_TOKEN_SIGNING_KEY,
        timeout: env.authTokenTimeouts.refreshToken,
      },
    );

    if (refreshTokenError) {
      return err(refreshTokenError, "signing refresh token");
    }

    return ok({
      accessToken,
      refreshToken,
    });
  },
);
