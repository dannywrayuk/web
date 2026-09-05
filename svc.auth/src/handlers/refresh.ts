import { verifyToken } from "@dannywrayuk/jwt";
import { refresh } from "../../generated/service.ts";
import { err, ok } from "@dannywrayuk/results";
import * as users from "@dannywrayuk/svc.user";
import { formatCookie } from "@dannywrayuk/service-platform/formatCookie";
import { generateTokens } from "../lib/generateTokens.ts";

export default refresh(async (event, ctx) => {
  const [tokenData, tokenValidationError] = verifyToken(
    event.cookies.refresh_token,
    ctx.secrets.AUTH_REFRESH_TOKEN_SIGNING_KEY,
  );

  if (tokenValidationError) {
    return err(tokenValidationError, "verifying refresh token");
  }

  const [user, findUserError] = await users.readUserById({
    userId: tokenData.sub,
  });

  if (findUserError) {
    return err(findUserError, "finding user from token sub");
  }

  if (!user) {
    return err(null, "User not found");
  }

  const [tokenResponse, tokenError] = generateTokens(ctx, {
    userId: user.id,
  });

  if (tokenError) {
    return err(tokenError, "generating tokens");
  }

  return ok({
    access_token: tokenResponse?.access_token,
    cookies: {
      refresh_token: formatCookie(
        "refresh_token",
        tokenResponse?.refresh_token,
        {
          httpOnly: true,
          secure: true,
          sameSite: "None",
        },
      ),
    },
    token_type: "Bearer",
    expires_in: ctx.env.accessTokenExpiry,
  });
});
