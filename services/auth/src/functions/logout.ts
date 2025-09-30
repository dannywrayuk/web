import { ok } from "@dannywrayuk/responses";

export const handler = async () => {
  return ok("bye", {
    cookies: [
      `refresh_token=invalid; Max-Age=-1; Path=/refresh; HttpOnly; SameSite=None; Secure;`,
    ],
  });
};
