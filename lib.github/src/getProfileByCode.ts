import { HandlerContext } from "@dannywrayuk/service-platform/HandlerContext";
import { getAccessToken } from "./getAccessToken.ts";
import { getUserInfo } from "./getUserInfo.ts";
import { ok, err } from "@dannywrayuk/results";
import { getPrimaryEmail } from "./getPrimaryEmail.ts";

export const getProfileByCode = async (
  context: HandlerContext<
    { githubUrl: string; githubApiUrl: string },
    ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"]
  >,
  data: { code: string },
) => {
  const [accessToken, accessTokenError] = await getAccessToken({
    code: data.code,
    clientId: context.secrets.GITHUB_CLIENT_ID,
    clientSecret: context.secrets.GITHUB_CLIENT_SECRET,
    githubOAuthUrl: context.env.githubUrl,
  });

  if (accessTokenError) {
    return err(accessTokenError);
  }

  const [userInfo, userInfoError] = await getUserInfo({
    accessToken: accessToken.access_token,
    githubApiUrl: context.env.githubApiUrl,
  });

  if (userInfoError) {
    return err(userInfoError);
  }

  const [email, emailError] = await getPrimaryEmail({
    accessToken: accessToken.access_token,
    githubApiUrl: context.env.githubApiUrl,
  });

  if (emailError) {
    return err(emailError);
  }

  return ok({
    id: userInfo.githubId,
    email,
    name: userInfo.name,
    username: userInfo.username,
    avatarUrl: userInfo.avatarUrl,
  });
};
