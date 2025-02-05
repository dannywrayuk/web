import { safe } from "../../lib/safe/safe";

export const getGithubUserInfo = safe(async (access_token: string) => {
  const userResponse = await fetch(
    `https://${process.env.mockUrl || ""}api.github.com/user`,
    {
      headers: {
        Authorization: `token ${access_token}`,
      },
    },
  );

  const user = await userResponse.json();

  if (!user) {
    throw new Error("Invalid user info response. Could not parse json");
  }

  return user;
});
