import { getAccessToken } from "@dannywrayuk/github/getAccessToken";
import { err, ok } from "@dannywrayuk/results";
import { getUserInfo } from "@dannywrayuk/github/getUserInfo";
import { readUserByGithubId } from "@dannywrayuk/svc.user/handlers.ts";
import { signToken } from "@dannywrayuk/jwt";
import { loginMethod } from "../../generated/service.ts";

export default loginMethod(async (event, { secrets, env, timestamp }) => {
  const [accessTokenResponse, accessTokenResponseError] = await getAccessToken({
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

  const [userRecord, userRecordError] = await readUserByGithubId.call({
    githubId: userInfoResponse.githubId,
  });

  if (userRecordError) {
    return err(userRecordError, "getting user id from github id");
  }
  if (!userRecord) {
    return err(null, "no user found with github id", "not-found");
  }

  const [accessToken, accessTokenError] = signToken(
    {
      sub: userRecord.userId,
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
      sub: userRecord.userId,
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
});
