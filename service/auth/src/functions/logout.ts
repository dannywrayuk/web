import { getCookies } from "@dannywrayuk/aws/getCookies";
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
      [
        `access_token=loggedOut`,
        `Max-Age=-1`,
        `Domain=${accessTokenData.result?.domain}`,
        "HttpOnly",
        "Secure",
        "SameSite=Strict",
      ].join("; "),
    );
  }

  if (!refreshTokenData.error && refreshTokenData.result?.domain) {
    clearCookies.push(
      [
        `refresh_token=loggedOut`,
        `Max-Age=-1`,
        `Domain=${refreshTokenData.result?.domain}`,
        "HttpOnly",
        "Secure",
        "SameSite=Strict",
      ].join("; "),
    );
  }

  return success("bye", {
    cookies: clearCookies,
  });
};
