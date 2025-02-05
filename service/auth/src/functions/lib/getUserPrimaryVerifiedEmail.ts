import { safe } from "../../lib/safe/safe";

export const getUserPrimaryVerifiedEmail = safe(
  async (access_token: string) => {
    const emailResponse = await fetch(
      `https://${process.env.mockUrl || ""}api.github.com/user/emails`,
      {
        headers: {
          Authorization: `token ${access_token}`,
        },
      },
    );

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
