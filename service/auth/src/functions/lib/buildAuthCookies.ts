import * as jwt from "jsonwebtoken";

const cookieSettings = ["HttpOnly", "Secure", "SameSite=Strict"];

export const buildAuthCookie = (
  tokenName: "access_token" | "refresh_token",
  token: string,
  expiresIn: number,
  domain: string | undefined,
) =>
  [
    `${tokenName}=${token}`,
    `Max-Age=${expiresIn}` + domain ? `Domain=${domain}` : "",
    ...cookieSettings,
  ].join("; ");

type TokenSettings = {
  signingKey: string;
  timeout: number;
};

const generateToken = (
  data: Record<string, string>,
  tokenSettings: TokenSettings,
) =>
  jwt.sign(data, tokenSettings.signingKey, {
    expiresIn: tokenSettings.timeout,
  });

export const buildAuthCookies = (
  userId: string,
  authTokens: {
    accessToken: TokenSettings;
    refreshToken: TokenSettings;
  },
  cookieDomain: string | undefined,
) => {
  const accessTokenCookie = buildAuthCookie(
    "access_token",
    generateToken({ userId }, authTokens.accessToken),
    authTokens.accessToken.timeout,
    cookieDomain,
  );

  const refreshTokenCookie = buildAuthCookie(
    "refresh_token",
    generateToken({ userId }, authTokens.refreshToken),
    authTokens.refreshToken.timeout,
    cookieDomain,
  );
  return [accessTokenCookie, refreshTokenCookie];
};
