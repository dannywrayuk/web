import { getCookies } from "@dannywrayuk/aws/getCookies";
import { success } from "./lib/results";
import { readToken } from "./lib/readToken";

export const handler = async (event: any) => {
  const cookies = getCookies(event, ["access_token", "refresh_token"] as const);

  const accessTokenData = readToken(cookies.access_token);
  const refreshTokenData = readToken(cookies.refresh_token);

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

  return success("bye", {
    cookies: clearCookies,
  });
};
