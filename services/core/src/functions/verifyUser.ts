import { getCookies } from "@dannywrayuk/aws/getCookies";
import { getSecrets } from "./verifyUser.gen";
import * as jwt from "jsonwebtoken";
import { safe } from "../lib/safe/safe";

const verifyToken = safe((token: string, signingKey: string) => {
  const decoded = jwt.verify(token, signingKey);
  if (typeof decoded === "string") {
    throw new Error("Invalid token");
  }
  return decoded;
});

export const handler = async (event: any) => {
  const secrets = await getSecrets();

  const cookies = getCookies(event, ["access_token"] as const);

  if (!cookies.access_token) {
    console.log("No tokens found in cookies");
    return { isAuthorized: false };
  }

  const accessTokenVerified = verifyToken(
    cookies.access_token,
    secrets.AUTH_ACCESS_TOKEN_SIGNING_KEY,
  );

  if (accessTokenVerified.error) {
    console.log("Error verifying access token", accessTokenVerified.error);
    return { isAuthorized: false };
  }

  return {
    isAuthorized: true,
    context: {
      tokenPayload: accessTokenVerified.result,
    },
  };
};
