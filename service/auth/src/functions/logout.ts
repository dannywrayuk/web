import { getCookies } from "@dannywrayuk/aws/getCookies";
import { buildAuthCookie } from "./lib/buildAuthCookies";
import { success } from "./lib/results";
import { readToken } from "./lib/readToken";

export const handler = async (event: any) => {
  const cookies = getCookies(event, {
    accessToken: "access_token",
    refreshToken: "refresh_token",
  });

  const accessTokenData = readToken(cookies.accessToken);
  const refreshTokenData = readToken(cookies.refreshToken);

  const clearCookies = [];
  if (!accessTokenData.error && accessTokenData.result?.domain) {
    clearCookies.push(
      buildAuthCookie(
        "access_token",
        "loggedOut",
        -1,
        accessTokenData.result.domain,
      ),
    );
  }

  if (!refreshTokenData.error && refreshTokenData.result?.domain) {
    clearCookies.push(
      buildAuthCookie(
        "refresh_token",
        "loggedOut",
        -1,
        refreshTokenData.result?.domain,
      ),
    );
  }

  return success("hello", {
    cookies: clearCookies,
  });
};
