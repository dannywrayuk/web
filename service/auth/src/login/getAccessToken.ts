import { safe } from "../lib/safe/safe";

export const getAccessToken = safe(
  async (code: string, client_id: string, client_secret: string) => {
    const accessResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ client_id, client_secret, code }),
      },
    );

    const { access_token, scope } = await accessResponse.json();

    if (!access_token) {
      throw new Error("Invalid access token response. Could not parse json");
    }

    return { access_token, scope };
  },
);
