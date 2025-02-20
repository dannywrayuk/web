import * as jwt from "jsonwebtoken";

type TokenSettings = {
  signingKey: string;
  timeout: number;
};

type TokenPayload = {
  sub: string;
  iss: string;
  sessionStarted: number;
} & Record<string, string | number | boolean>;

const generateToken = (data: TokenPayload, tokenSettings: TokenSettings) =>
  jwt.sign(data, tokenSettings.signingKey, {
    expiresIn: tokenSettings.timeout,
  });

export const buildAuthCookies = (
  payload: TokenPayload,
  authTokens: {
    accessToken: TokenSettings;
    refreshToken: TokenSettings;
  },
) => {
  const accessTokenCookie = [
    `access_token=${generateToken(payload, authTokens.accessToken)}`,
    `Max-Age=${authTokens.accessToken.timeout}`,
    `Domain=${payload.iss}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
  ].join("; ");

  const refreshTokenCookie = [
    `refresh_token=${generateToken({ sub: payload.sub, iss: payload.iss, sessionStarted: payload.sessionStarted }, authTokens.refreshToken)}`,
    `Max-Age=${authTokens.refreshToken.timeout}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
  ].join("; ");

  return [accessTokenCookie, refreshTokenCookie];
};
