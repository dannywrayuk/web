import { getCookies } from "@dannywrayuk/aws/getCookies";
import { getEnv } from "@dannywrayuk/aws/getEnv";
import { getSecrets } from "@dannywrayuk/aws/getSecrets";
import { verifyToken } from "./lib/verifyToken";
import { LambdaEnv } from "./verify-env.gen";

const env = getEnv<LambdaEnv>();

const unauthorized = { isAuthorized: false };

export const handler = async (event: any) => {
  const secrets = await getSecrets(
    { stage: env.stage },
    {
      accessTokenSigningKey: "AUTH_ACCESS_TOKEN_SIGNING_KEY",
    },
  );

  const cookies = getCookies(event, {
    accessToken: "access_token",
    refreshToken: "refresh_token",
  });

  if (!cookies.accessToken || !cookies.refreshToken) {
    console.log("No tokens found in cookies");
    return unauthorized;
  }

  const accessTokenVerified = verifyToken(
    cookies.accessToken,
    secrets.accessTokenSigningKey,
  );

  if (accessTokenVerified.error) {
    console.log("Error verifying access token", accessTokenVerified.error);
    return unauthorized;
  }

  return {
    isAuthorized: true,
    context: {
      tokenPayload: accessTokenVerified.result,
    },
  };
};
