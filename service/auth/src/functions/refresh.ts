import { dynamoDBTableCRUD } from "@dannywrayuk/aws/dynamoDBTable";
import { getCookies } from "@dannywrayuk/aws/getCookies";
import { getSecrets } from "@dannywrayuk/aws/getSecrets";
import { buildAuthCookies } from "./lib/buildAuthCookies";
import { failure, success } from "./lib/results";
import { env } from "./refresh-env.gen";
import { verifyToken } from "./lib/verifyToken";

const userTable = dynamoDBTableCRUD(env.USER_TABLE_NAME);

export const handler = async (event: any) => {
  const secrets = await getSecrets({
    accessTokenSigningKey: "AUTH_ACCESS_TOKEN_SIGNING_KEY",
    refreshTokenSigningKey: "AUTH_REFRESH_TOKEN_SIGNING_KEY",
  });

  const cookies = getCookies(event, {
    accessToken: "access_token",
    refreshToken: "refresh_token",
  });

  if (!cookies.refreshToken) {
    return failure();
  }

  const refreshTokenVerified = verifyToken(
    cookies.refreshToken,
    secrets.refreshTokenSigningKey,
  );

  if (refreshTokenVerified.error) {
    return failure();
  }

  const refreshTokenData = refreshTokenVerified.result;

  const userQuery = await userTable.read(
    `USER_ID#${refreshTokenData.userId}`,
    "RECORD",
  );

  if (!userQuery?.length) {
    return failure();
  }
  const user = userQuery[0];

  const authCookies = buildAuthCookies(user.USER_ID, {
    accessToken: {
      signingKey: secrets.accessTokenSigningKey,
      timeout: env.AUTH_TOKEN_TIMEOUTS.accessToken,
    },
    refreshToken: {
      signingKey: secrets.refreshTokenSigningKey,
      timeout: env.AUTH_TOKEN_TIMEOUTS.refreshToken,
    },
  });

  return success("hello", {
    cookies: authCookies,
  });
};
