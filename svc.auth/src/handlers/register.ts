import { register } from "../../generated/service.ts";
import { err, ok } from "@dannywrayuk/results";
import * as github from "@dannywrayuk/github";
import * as users from "@dannywrayuk/svc.user";
import { formatCookie } from "@dannywrayuk/service-platform/formatCookie";
import { generateTokens } from "../lib/generateTokens.ts";
import { HandlerContext } from "@dannywrayuk/service-platform/HandlerContext";

const getOrCreateUser = async (
  ctx: HandlerContext,
  profile: { id: string; email: string; name: string },
) => {
  const [userResponse, userError] = await users.readByGithubId(ctx, profile.id);

  if (userError) {
    return err(userError, "reading user by github id");
  }

  if (userResponse) {
    return ok(userResponse);
  }

  const [createUserResponse, createUserError] = await users.create(profile);

  if (createUserError) {
    return err(createUserError, "creating user");
  }

  return ok(createUserResponse);
};

export default register(async (event, ctx) => {
  const [githubResponse, githubError] = await github.getProfileByCode(ctx, {
    code: event.query.code,
  });

  if (githubError) {
    return err(githubError, "reading github profile");
  }

  const [userResponse, userError] = await getOrCreateUser(ctx, githubResponse);

  if (userError) {
    return err(userError, "getting or creating user");
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
