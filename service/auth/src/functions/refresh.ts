import * as jwt from "jsonwebtoken";
import { getSecrets } from "../lib/aws/getSecrets";
import { failure, success } from "../lib/results";
import { safe } from "../lib/safe/safe";
import { getCookies } from "../lib/aws/getCookies";

const verifyToken = safe(jwt.verify);

export const handler = async (event: any) => {
  const { accessTokenSigningKey, refreshTokenSigningKey } = await getSecrets({
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
    refreshTokenSigningKey,
  );

  if (refreshTokenVerified.error) {
    return failure();
  }

  const refreshTokenData = refreshTokenVerified.result;
  console.log(refreshTokenData);
  return success();
};
