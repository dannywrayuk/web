import { getCookies } from "@dannywrayuk/aws/getCookies";
import { getEnv } from "@dannywrayuk/aws/getEnv";
import { readToken } from "../../../../lib/readToken";
import { removeUserFromDb } from "../../../../lib/removeUserFromDb";
import { failure, success } from "../../../../lib/results";
import { safe } from "../../../../lib/safe/safe";
import { LambdaEnv } from "./GET-env.gen";

const hourInSeconds = 60 * 60;
const env = getEnv<LambdaEnv>();

export const handler = async (event: any) => {
  const tokenPayload = event.requestContext.authorizer.lambda.tokenPayload;
  const sessionLength = Date.now() / 1000 - tokenPayload.sessionStarted;

  if (sessionLength > hourInSeconds) {
    console.log({ message: "Session too old", sessionLength });
    return failure();
  }

  const removeUser = await safe(removeUserFromDb)(
    env.userTableName,
    tokenPayload.sub,
  );

  if (removeUser.error) {
    console.error({
      message: "Failed to delete user",
      error: removeUser.error,
    });

    return failure();
  }

  const cookies = getCookies(event, {
    accessToken: "access_token",
    refreshToken: "refresh_token",
  });

  const accessTokenData = readToken(cookies.accessToken);
  const refreshTokenData = readToken(cookies.refreshToken);

  const clearCookies = [];
  if (!accessTokenData.error && accessTokenData.result?.iss) {
    clearCookies.push(
      [
        `access_token=loggedOut`,
        `Max-Age=-1`,
        `Domain=${accessTokenData.result?.iss}`,
        "HttpOnly",
        "Secure",
        "SameSite=Strict",
        "Path=/",
      ].join("; "),
    );
  }

  if (!refreshTokenData.error && refreshTokenData.result?.iss) {
    clearCookies.push(
      [
        `refresh_token=loggedOut`,
        `Max-Age=-1`,
        "HttpOnly",
        "Secure",
        "SameSite=Strict",
        "Path=/",
      ].join("; "),
    );
  }
  return success("bye", { cookies: clearCookies });
};
