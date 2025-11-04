import { z } from "zod";

export const githubAccessTokenResponse = z.object({
  access_token: z.string(),
  scope: z.string(),
  token_type: z.string(),
});

export type GithubAccessTokenResponse = z.infer<
  typeof githubAccessTokenResponse
>;

export const githubUserResponse = z.object({
  id: z.number(),
  login: z.string(),
  name: z.string(),
  avatar_url: z.string(),
});

export type GithubUserResponse = z.infer<typeof githubUserResponse>;

export const githubEmailsResponse = z.array(
  z.object({
    primary: z.boolean(),
    verified: z.boolean(),
    email: z.string(),
  }),
);

export type GithubEmailsResponse = z.infer<typeof githubEmailsResponse>;
