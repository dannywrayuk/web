import { formatCookie } from "@dannywrayuk/service-platform/formatCookie";
import { logout } from "../../generated/service.ts";
import { ok } from "@dannywrayuk/results";

export default logout(async () => {
  return ok({
    headers: {
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
    cookies: {
      refresh_token: formatCookie("refresh_token", "invalid", {
        "Max-Age": -1,
        Path: "/refresh",
        HttpOnly: true,
        SameSite: "None",
        Secure: true,
        Partitioned: true,
      }),
    },
  });
});
