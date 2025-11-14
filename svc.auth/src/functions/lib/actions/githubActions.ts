import { err, ok } from "@dannywrayuk/results";
import { validatedFetch } from "@dannywrayuk/validatedFetch";
import { okResponse } from "@dannywrayuk/schema/common/responses";
import {
  githubAccessTokenResponse,
  githubEmailsResponse,
  githubUserResponse,
} from "@dannywrayuk/schema/external/github";

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
    const [accessResponse, accessResponseError] = await validatedFetch(
      okResponse(githubAccessTokenResponse),
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

    if (
      requiredScopes?.length &&
      !requiredScopes.every((requiredScope) =>
        accessResponse.body.scope?.includes(requiredScope),
      )
    ) {
      return err("required scopes not met");
    }

    if (!accessResponse.body.access_token) {
      return err("Invalid access token response. Could not parse json");
    }
    return ok(accessResponse.body.access_token);
  };

export const getUserInfo =
  ({ githubApiUrl }: { githubApiUrl: string }) =>
  async (accessToken: string) => {
    const [userResponse, userResponseError] = await validatedFetch(
      okResponse(githubUserResponse),
    )(`${githubApiUrl}/user`, {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });
    if (userResponseError) {
      return err(userResponseError, "fetching user info");
    }

    return ok({
      EXTERNAL_ID: String(userResponse.body.id),
      USERNAME: userResponse.body.login,
      AVATAR_URL: userResponse.body.avatar_url,
      NAME: userResponse.body.name,
    });
  };

export const getPrimaryEmail =
  ({ githubApiUrl }: { githubApiUrl: string }) =>
  async (accessToken: string) => {
    const [emailResponse, emailResponseError] = await validatedFetch(
      okResponse(githubEmailsResponse),
    )(`${githubApiUrl}/user/emails`, {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });
    if (emailResponseError) {
      return err(emailResponseError, "fetching user emails");
    }

    const email = emailResponse.body.find(
      (email: any) => email.primary && email.verified,
    )?.email;
    if (!email) {
      return err("no primary email found");
    }

    return ok(email);
  };
