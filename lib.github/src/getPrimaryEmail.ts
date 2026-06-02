import { validatedFetch } from "@dannywrayuk/validatedFetch";
import { err, ok } from "@dannywrayuk/results";
import z from "zod";

export const githubEmailsResponse = z.array(
  z.object({
    primary: z.boolean(),
    verified: z.boolean(),
    email: z.string(),
  }),
);

export type GithubEmailsResponse = z.infer<typeof githubEmailsResponse>;

export const getPrimaryEmail = async ({
  accessToken,
  githubApiUrl,
}: {
  accessToken: string;
  githubApiUrl: string;
}) => {
  const [emailResponse, emailResponseError] = await validatedFetch(
    z.object({
      status: z.literal(200),
      body: githubEmailsResponse,
    }),
  )(`${githubApiUrl}/user/emails`, {
    headers: {
      Authorization: `token ${accessToken}`,
    },
  });

  if (emailResponseError) {
    return err(emailResponseError, "fetching user emails");
  }

  const email = emailResponse.body.find(
    (email) => email.primary && email.verified,
  )?.email;
  if (!email) {
    return err(null, "no primary email found");
  }

  return ok(email);
};
