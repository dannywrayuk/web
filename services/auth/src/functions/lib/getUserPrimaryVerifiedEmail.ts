import { safe } from "@dannywrayuk/safe";

export const getUserPrimaryVerifiedEmail = safe(
  async (githubApiUrl: string, accessToken: string) => {
    const emailResponse = await fetch(`${githubApiUrl}/user/emails`, {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });

    const emails = await emailResponse.json();

    if (!emails) {
      throw new Error("Invalid userEmails response. Could not parse json");
    }

    const email = emails.find(
      (email: any) => email.primary && email.verified,
    ).email;

    return email;
  },
);
