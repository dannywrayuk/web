import { dynamoDBTableCRUD } from "../lib/aws/dynamoDBTable";
import { getSecrets } from "../lib/aws/getSecrets";
import { failure, success } from "../lib/results";
import { getAccessToken } from "./getAccessToken";
import { getGithubUserInfo } from "./getGithubUserInfo";
import { getUserPrimaryVerifiedEmail } from "./getUserPrimaryVerifiedEmail";

const userTable = dynamoDBTableCRUD(process.env.USER_TABLE_NAME);

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
  const userData = await userTable.read(
    "GITHUB_ID#" + githubUserInfo.id,
    "USER_ID",
  );

  if (userData?.length) {
    console.log("user already exists");
    return success();
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
  // Create auth tokens and return them to the client

  return success();
};
