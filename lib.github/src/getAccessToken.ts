import { err, ok } from "@dannywrayuk/results";
import { validatedFetch } from "@dannywrayuk/validatedFetch";
import { z } from "zod";

export const githubAccessTokenResponse = z.object({
  access_token: z.string(),
  scope: z.string(),
  token_type: z.string(),
});

export type GithubAccessTokenResponse = z.infer<
  typeof githubAccessTokenResponse
>;

export const getAccessToken = async ({
  code,
  clientId,
  clientSecret,
  githubOAuthUrl,
}: {
  code: string;
  clientId: string;
  clientSecret: string;
  githubOAuthUrl: string;
}) => {
  const [accessResponse, accessResponseError] = await validatedFetch(
    z.object({
      status: z.literal(200),
      body: githubAccessTokenResponse,
    }),
  )(`${githubOAuthUrl}/login/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (accessResponseError) {
    return err(accessResponseError, "fetching access token");
  }

  return ok(accessResponse.body);
};
