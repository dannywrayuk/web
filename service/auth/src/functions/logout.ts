import { buildAuthCookie } from "./lib/buildAuthCookies";
import { success } from "./lib/results";

export const handler = async () => {
  return success("hello", {
    cookies: [
      buildAuthCookie("access_token", "loggedOut", -1),
      buildAuthCookie("refresh_token", "loggedOut", -1),
    ],
  });
};
