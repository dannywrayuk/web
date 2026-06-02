import { serviceFunction } from "@dannywrayuk/service-platform/serviceFunction";
import { signup } from "../../handlers.ts";
import type { Env } from "../../generated/config.ts";
import { getAccessToken } from "@dannywrayuk/github/getAccessToken";
import { err, ok } from "@dannywrayuk/results";
import { getUserInfo } from "@dannywrayuk/github/getUserInfo";
import { readUserByGithubId, createUserByGithubId } from "@dannywrayuk/svc.user/handlers.ts";
import { signToken } from "@dannywrayuk/jwt";
import { getPrimaryEmail } from "@dannywrayuk/github/getPrimaryEmail";

export const handler = serviceFunction<Env>()(
  signup,
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

    const [existingRecord, existingRecordError] = await readUserByGithubId.call({ githubId: userInfoResponse.githubId });

    if (existingRecordError) {
      return err(existingRecordError, "getting user id from github id");
    }
    if (existingRecord) {
      return err(null, "user already exists with github id", "already-exists");
    }

    const [primaryEmail, primaryEmailError] = await getPrimaryEmail({
      accessToken: accessTokenResponse.access_token,
      githubApiUrl: env.githubApiUrl,
    });

    if (primaryEmailError) {
      return err(primaryEmailError, "getting primary email");
    }

    const [newUserRecord, newUserRecordError] = await createUserByGithubId.call({
      name: userInfoResponse.name,
      username: userInfoResponse.username,
      avatarUrl: userInfoResponse.avatarUrl,
      email: primaryEmail,
      githubId: userInfoResponse.githubId
    });

    if (newUserRecordError) {
      return err(newUserRecordError, "creating user record");
    }

    const [accessToken, accessTokenError] = signToken(
      {
        sub: newUserRecord.userId,
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
        sub: newUserRecord.userId,
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
