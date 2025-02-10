import { safe } from "../../lib/safe/safe";

export const getAccessToken = safe(
  async (code: string, clientId: string, clientSecret: string) => {
    const accessResponse = await fetch(
      `https://${process.env.mockUrl || ""}github.com/login/oauth/access_token`,
      {
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
      },
    );

    const { access_token, scope } = await accessResponse.json();

    if (!access_token) {
      throw new Error("Invalid access token response. Could not parse json");
    }

    return { access_token, scope };
  },
);
