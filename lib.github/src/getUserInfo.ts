import { validatedFetch } from "@dannywrayuk/validatedFetch";
import { err, ok } from "@dannywrayuk/results";
import { z } from "zod";

export const githubUserResponse = z.object({
  id: z.number(),
  login: z.string(),
  name: z.string(),
  avatar_url: z.string(),
});

export type GithubUserResponse = z.infer<typeof githubUserResponse>;

export const getUserInfo = async ({
  accessToken,
  githubApiUrl,
}: {
  accessToken: string;
  githubApiUrl: string;
}) => {
  const [userResponse, userResponseError] = await validatedFetch(
    z.object({
      status: z.literal(200),
      body: githubUserResponse,
    }),
  )(`${githubApiUrl}/user`, {
    headers: {
      Authorization: `token ${accessToken}`,
    },
  });

  if (userResponseError) {
    return err(userResponseError, "fetching user info");
  }

  return ok({
    githubId: String(userResponse.body.id),
    username: userResponse.body.login,
    avatarUrl: userResponse.body.avatar_url,
    name: userResponse.body.name,
  });
};
