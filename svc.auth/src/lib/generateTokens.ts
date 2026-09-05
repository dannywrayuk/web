import { err, ok } from "@dannywrayuk/results";
import { HandlerContext } from "@dannywrayuk/service-platform/HandlerContext";
import { signToken } from "@dannywrayuk/jwt";

export const generateTokens = (
  context: HandlerContext<
    {
      accessTokenExpiry: string;
      refreshTokenExpiry: string;
    },
    ["AUTH_ACCESS_TOKEN_SIGNING_KEY", "AUTH_REFRESH_TOKEN_SIGNING_KEY"]
  >,
  data: { userId: string },
) => {
  const [access_token, accessTokenError] = signToken(
    { sub: data.userId, iss: "my-service" },
    {
      signingKey: context.secrets.AUTH_ACCESS_TOKEN_SIGNING_KEY,
      timeout: Number(context.env.accessTokenExpiry),
    },
  );

  if (accessTokenError) {
    return err(accessTokenError, "signing access token");
  }

  const [refresh_token, refreshTokenError] = signToken(
    { sub: data.userId, iss: "my-service" },
    {
      signingKey: context.secrets.AUTH_REFRESH_TOKEN_SIGNING_KEY,
      timeout: Number(context.env.refreshTokenExpiry),
    },
  );

  if (refreshTokenError) {
    return err(refreshTokenError, "signing refresh token");
  }

  return ok({
    access_token,
    refresh_token,
  });
};
