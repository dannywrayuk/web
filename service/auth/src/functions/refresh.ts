import { dynamoDBTableCRUD } from "@dannywrayuk/aws/dynamoDBTable";
import { getCookies } from "@dannywrayuk/aws/getCookies";
import { getSecrets } from "@dannywrayuk/aws/getSecrets";
import { buildAuthCookies } from "./lib/buildAuthCookies";
import { failure, success } from "./lib/results";
import { LambdaEnv } from "./refresh-env.gen";
import { verifyToken } from "./lib/verifyToken";
import { getEnv } from "./lib/getEnv";
import { calculateCookieDomain } from "./lib/calculateCookieDomain";

const env = getEnv<LambdaEnv>();

const userTable = dynamoDBTableCRUD(env.userTableName);

export const handler = async (event: any) => {
  const secrets = await getSecrets(
    { stage: env.stage },
    {
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

  const cookieDomain = calculateCookieDomain(
    env.stage,
    event.headers?.stage,
    env.stage !== "prod" ? env.cookieStages : undefined,
    env.domainName,
  );
  const user = userQuery[0];

  const authCookies = buildAuthCookies(
    user.USER_ID,
    tokenSettings,
    cookieDomain,
  );

  return success("hello", {
    cookies: authCookies,
  });
};
