import { safe } from "../../lib/safe/safe";

export const getGithubUserInfo = safe(
  async (githubApiUrl: string, accessToken: string) => {
    const userResponse = await fetch(`${githubApiUrl}/user`, {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });

    const user = await userResponse.json();

    if (!user) {
      throw new Error("Invalid user info response. Could not parse json");
    }

    return user;
  },
);
