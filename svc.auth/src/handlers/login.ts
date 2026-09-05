import { login } from "../../generated/service.ts";
import { err, ok } from "@dannywrayuk/results";
import * as github from "@dannywrayuk/github";
import * as users from "@dannywrayuk/svc.user";
import { formatCookie } from "@dannywrayuk/service-platform/formatCookie";
import { generateTokens } from "../lib/generateTokens.ts";

export default login(async (event, ctx) => {
  const [githubResponse, githubError] = await github.getIdByCode(ctx, {
    code: event.query.code,
  });

  if (githubError) {
    return err(githubError, "reading github id");
  }

  const [userResponse, userError] = await users.readByGithubId(
    ctx,
    githubResponse?.id,
  );

  if (userError) {
    return err(userError, "reading user by github id");
  }

  if (!userResponse) {
    return err(null, "user not found", "not-found");
  }

  const [tokenResponse, tokenError] = generateTokens(ctx, {
    userId: userResponse.id,
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
