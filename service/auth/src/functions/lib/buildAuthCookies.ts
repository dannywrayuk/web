import { generateAuthTokens } from "./generateAuthTokens";

const authTokenExpiry = {
  access_token: 60 * 60 * 6,
  refresh_token: 60 * 60 * 24 * 30,
} as const;

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

export const buildAuthCookies = (userId: string) => {
  const accessTokenCookie = buildAuthCookie(
    "access_token",
    generateAuthTokens({
      userId,
      expiresIn: authTokenExpiry.access_token,
    }),
    authTokenExpiry.access_token,
  );

  const refreshTokenCookie = buildAuthCookie(
    "refresh_token",
    generateAuthTokens({
      userId,
      expiresIn: authTokenExpiry.access_token,
    }),
    authTokenExpiry.access_token,
  );
  return [accessTokenCookie, refreshTokenCookie];
};
