import { dynamoDBTableCRUD } from "../lib/aws/dynamoDBTable";
import { getSecrets } from "../lib/aws/getSecrets";
import { failure, success } from "./lib/results";
import { getAccessToken } from "./lib/getAccessToken";
import { getGithubUserInfo } from "./lib/getGithubUserInfo";
import { getUserPrimaryVerifiedEmail } from "./lib/getUserPrimaryVerifiedEmail";
import { LambdaEnv } from "./login-env.gen";
import { buildAuthCookies } from "./lib/buildAuthCookies";
import { randomUUID } from "crypto";
import { safe } from "../lib/safe/safe";

const env = process.env as LambdaEnv;

const userTable = dynamoDBTableCRUD(env.USER_TABLE_NAME);

export const handler = async (event: any) => {
  const { client_id, client_secret } = await getSecrets({
    client_id: "GITHUB_CLIENT_ID",
    client_secret: "GITHUB_CLIENT_SECRET",
  });

  const { code } = event.queryStringParameters;

  console.log("Begin getAccessToken");
  const getAccessTokenCall = await getAccessToken(
    code,
    client_id,
    client_secret,
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
  const getGithubUserInfoCall = await getGithubUserInfo(access_token);

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

  if (userIdQuery?.length) {
    console.log("user already exists");
    const userId = userIdQuery[0].USER_ID;
    const authCookies = buildAuthCookies(userId);
    return success("hello", {
      cookies: authCookies,
    });
  }

  console.log("Begin getEmail");
  const getUserPrimaryVerifiedEmailCall =
    await getUserPrimaryVerifiedEmail(access_token);

  if (getUserPrimaryVerifiedEmailCall.error) {
    return failure();
  }
  console.log("End getEmail");

  const email = getUserPrimaryVerifiedEmailCall.result;

  // Create a new user in the database
  const userId = randomUUID();

  const createUserRecordCall = await safe(userTable.create)(
    `USER_ID#${userId}`,
    "RECORD",
    {
      USER_ID: userId,
      GITHUB_ID: githubUserInfo.id,
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

  // Create auth tokens and return them to the client
  const authCookies = buildAuthCookies(userId);
  return success("hello", {
    cookies: authCookies,
  });
};
