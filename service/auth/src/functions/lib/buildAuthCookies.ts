import * as jwt from "jsonwebtoken";

const cookieSettings = [
  "HttpOnly",
  "Secure",
  "SameSite=Strict",
  "Domain=dannywray.co.uk",
];

export const buildAuthCookie = (
  tokenName: "access_token" | "refresh_token",
  token: string,
  expiresIn: number,
) =>
  [`${tokenName}=${token}`, `Max-Age=${expiresIn}`, ...cookieSettings].join(
    "; ",
  );

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
) => {
  const accessTokenCookie = buildAuthCookie(
    "access_token",
    generateToken({ userId }, authTokens.accessToken),
    authTokens.accessToken.timeout,
  );

  const refreshTokenCookie = buildAuthCookie(
    "refresh_token",
    generateToken({ userId }, authTokens.refreshToken),
    authTokens.refreshToken.timeout,
  );
  return [accessTokenCookie, refreshTokenCookie];
};
