import { dynamoDBTableCRUD } from "@dannywrayuk/aws/dynamoDBTable";
import { getSecrets } from "@dannywrayuk/aws/getSecrets";
import { randomUUID } from "crypto";
import { safe } from "../lib/safe/safe";
import { buildAuthCookies } from "./lib/buildAuthCookies";
import { getAccessToken } from "./lib/getAccessToken";
import { getGithubUserInfo } from "./lib/getGithubUserInfo";
import { getUserPrimaryVerifiedEmail } from "./lib/getUserPrimaryVerifiedEmail";
import { failure, success } from "./lib/results";
import { calculateCookieDomain } from "./lib/calculateCookieDomain";
import { getEnv } from "./lib/getEnv";
import { LambdaEnv } from "./login-env.gen";

const env = getEnv<LambdaEnv>();

const userTable = dynamoDBTableCRUD(env.userTableName);

export const handler = async (event: any) => {
  const secrets = await getSecrets(
    { stage: env.stage },
    {
      clientId: "GITHUB_CLIENT_ID",
      clientSecret: "GITHUB_CLIENT_SECRET",
      accessTokenSigningKey: "AUTH_ACCESS_TOKEN_SIGNING_KEY",
      refreshTokenSigningKey: "AUTH_REFRESH_TOKEN_SIGNING_KEY",
    },
  );

  const tokenSettings = {
    accessToken: {
      signingKey: secrets.accessTokenSigningKey,
      timeout: env.authTokenTimeouts.accessToken,
    },
    refreshToken: {
      signingKey: secrets.refreshTokenSigningKey,
      timeout: env.authTokenTimeouts.refreshToken,
    },
  };

  const { code } = event.queryStringParameters;

  console.log("Begin getAccessToken");
  const getAccessTokenCall = await getAccessToken(
    env.githubUrl,
    code,
    secrets.clientId,
    secrets.clientSecret,
  );

  if (getAccessTokenCall.error) {
    return failure();
  }
  console.log("End getAccessToken");

  const { access_token, scope } = getAccessTokenCall.result;

  if (!scope.includes("user:email") && !scope.includes("read:user")) {
    return failure();
  }

  console.log("Begin getGithubUserInfo");
  const getGithubUserInfoCall = await getGithubUserInfo(
    env.githubApiUrl,
    access_token,
  );

  if (getGithubUserInfoCall.error) {
    return failure();
  }
  console.log("End getGithubUserInfo");

  const githubUserInfo = getGithubUserInfoCall.result;

  // Check if the user already has an account
  // If the user has an account, return auth tokens
  const userIdQuery = await userTable.read(
    "GITHUB_ID#" + githubUserInfo.id,
    "USER_ID",
  );

  const cookieDomain = calculateCookieDomain(
    env.stage,
    event.headers?.stage,
    env.stage !== "prod" ? env.cookieStages : undefined,
    env.domainName,
  );

  if (userIdQuery?.length) {
    console.log("user already exists");
    const userId = userIdQuery[0].USER_ID;
    const authCookies = buildAuthCookies(
      { sub: userId, iss: cookieDomain, iat: new Date().toISOString() },
      tokenSettings,
    );
    return success("hello", {
      cookies: authCookies,
    });
  }

  console.log("Begin getEmail");
  const getUserPrimaryVerifiedEmailCall = await getUserPrimaryVerifiedEmail(
    env.githubApiUrl,
    access_token,
  );

  if (getUserPrimaryVerifiedEmailCall.error) {
    return failure();
  }
  console.log("End getEmail");

  const email = getUserPrimaryVerifiedEmailCall.result;

  const userId = randomUUID();

  const createUserRecordCall = await safe(userTable.create)(
    `USER_ID#${userId}`,
    "RECORD",
    {
      USER_ID: userId,
      EMAIL: email,
      USERNAME: githubUserInfo.login,
      NAME: githubUserInfo.name,
      AVATAR_URL: githubUserInfo.avatar_url,
      CREATED_AT: new Date().toISOString(),
    },
  );

  if (createUserRecordCall.error) {
    console.log("createUserRecordCall.error", createUserRecordCall.error);
    return failure();
  }

  const linkUserGithubCall = await safe(userTable.create)(
    "GITHUB_ID#" + githubUserInfo.id,
    "USER_ID#" + userId,
    {
      USER_ID: userId,
      GITHUB_ID: githubUserInfo.id,
    },
  );

  if (linkUserGithubCall.error) {
    return failure();
  }

  const authCookies = buildAuthCookies(
    { sub: userId, iss: cookieDomain, iat: new Date().toISOString() },
    tokenSettings,
  );

  return success("hello", {
    cookies: authCookies,
  });
};
