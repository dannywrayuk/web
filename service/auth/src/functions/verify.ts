import * as jwt from "jsonwebtoken";
import { getSecrets } from "@dannywrayuk/aws/getSecrets";
import { safe } from "../lib/safe/safe";
import { getCookies } from "@dannywrayuk/aws/getCookies";

const unauthorized = { isAuthorized: false };

const verifyToken = safe((token: string, signingKey: string) => {
  const decoded = jwt.verify(token, signingKey);
  if (typeof decoded === "string") {
    throw new Error("Invalid token");
  }
  return decoded;
});

export const handler = async (event: any) => {
  const { accessTokenSigningKey } = await getSecrets({
    accessTokenSigningKey: "AUTH_ACCESS_TOKEN_SIGNING_KEY",
  });

  const cookies = getCookies(event, {
    accessToken: "access_token",
    refreshToken: "refresh_token",
  });

  if (!cookies.accessToken || !cookies.refreshToken) {
    return unauthorized;
  }

  const accessTokenVerified = verifyToken(
    cookies.accessToken,
    accessTokenSigningKey,
  );

  if (accessTokenVerified.error) {
    return unauthorized;
  }

  return {
    isAuthorized: true,
    context: {
      ...accessTokenVerified.result,
    },
  };
};
