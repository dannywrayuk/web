import { buildAuthCookie } from "./lib/buildAuthCookies";
import { success } from "./lib/results";
import { env } from "./logout-env.gen";

export const handler = async () => {
  return success("hello", {
    cookies: [
      buildAuthCookie("access_token", "loggedOut", -1, env.cookieDomain),
      buildAuthCookie("refresh_token", "loggedOut", -1, env.cookieDomain),
    ],
  });
};
