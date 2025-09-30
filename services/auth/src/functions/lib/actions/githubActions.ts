import { err, ok, unsafe } from "@dannywrayuk/results";

export const getAccessToken =
  ({
    clientId,
    clientSecret,
    githubOAuthUrl,
    requiredScopes,
  }: {
    clientId: string;
    clientSecret: string;
    githubOAuthUrl: string;
    requiredScopes?: string[];
  }) =>
  async (code: string) => {
    const [accessResponse, accessResponseError] = await unsafe(fetch)(
      `${githubOAuthUrl}/login/oauth/access_token`,
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
    if (accessResponseError) {
      return err(accessResponseError, "fetching access token");
    }
    const [accessResponseData, accessResponseDataError] = await unsafe(() =>
      accessResponse.json(),
    )();
    if (accessResponseDataError) {
      return err(accessResponseDataError, "parsing access token response");
    }
    if (
      requiredScopes?.length &&
      !requiredScopes.every((requiredScope) =>
        accessResponseData.scope?.includes(requiredScope),
      )
    ) {
      return err("required scopes not met");
    }

    if (!accessResponseData.access_token) {
      return err("Invalid access token response. Could not parse json");
    }
    return ok(accessResponseData.access_token);
  };

export const getUserInfo =
  ({ githubApiUrl }: { githubApiUrl: string }) =>
  async (accessToken: string) => {
    const [userResponse, userResponseError] = await unsafe(fetch)(
      `${githubApiUrl}/user`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      },
    );
    if (userResponseError) {
      return err(userResponseError, "fetching user info");
    }

    const [user, userError] = await unsafe(() => userResponse.json())();

    if (userError) {
      return err(userError, "parsing user info response");
    }

    return ok(user);
  };

export const getPrimaryEmail =
  ({ githubApiUrl }: { githubApiUrl: string }) =>
  async (accessToken: string) => {
    const [emailResponse, emailResponseError] = await unsafe(fetch)(
      `${githubApiUrl}/user/emails`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      },
    );
    if (emailResponseError) {
      return err(emailResponseError, "fetching user emails");
    }

    const [emails, emailsError] = await unsafe(() => emailResponse.json())();
    if (emailsError) {
      return err(emailsError, "parsing user emails response");
    }

    const email = emails?.find(
      (email: any) => email.primary && email.verified,
    )?.email;
    if (!email) {
      return err("no primary email found");
    }

    return ok(email);
  };
