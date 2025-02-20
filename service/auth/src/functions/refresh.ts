import { dynamoDBTableCRUD } from "@dannywrayuk/aws/dynamoDBTable";
import { getCookies } from "@dannywrayuk/aws/getCookies";
import { getSecrets } from "@dannywrayuk/aws/getSecrets";
import { buildAuthCookies } from "./lib/buildAuthCookies";
import { calculateCookieDomain } from "./lib/calculateCookieDomain";
import { getEnv } from "./lib/getEnv";
import { failure, success } from "./lib/results";
import { verifyToken } from "./lib/verifyToken";
import { LambdaEnv } from "./refresh-env.gen";

const env = getEnv<LambdaEnv>();

const userTable = dynamoDBTableCRUD(env.userTableName);

export const handler = async (event: any) => {
  console.log(event);
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
    console.log("No refresh token found in cookies");
    return failure();
  }

  const refreshTokenVerified = verifyToken(
    cookies.refreshToken,
    secrets.refreshTokenSigningKey,
  );

  if (refreshTokenVerified.error) {
    console.log("Error verifying refresh token", refreshTokenVerified.error);
    return failure();
  }

  const refreshTokenData = refreshTokenVerified.result;

  const userQuery = await userTable.read(
    `USER_ID#${refreshTokenData.sub}`,
    "RECORD",
  );

  if (!userQuery?.length) {
    console.log("User not found");
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
    {
      sub: user.USER_ID,
      iss: cookieDomain,
      sessionStarted: refreshTokenData.sessionStarted,
    },
    tokenSettings,
  );

  return success("hello", {
    cookies: authCookies,
  });
};
