import { getCookies } from "@dannywrayuk/aws/getCookies";
import { getSecrets } from "@dannywrayuk/aws/getSecrets";
import { verifyToken } from "./lib/verifyToken";

const unauthorized = { isAuthorized: false };

export const handler = async (event: any) => {
  const secrets = await getSecrets({
    accessTokenSigningKey: "AUTH_ACCESS_TOKEN_SIGNING_KEY",
  });

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
      ...accessTokenVerified.result,
    },
  };
};
