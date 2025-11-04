import * as jwt from "jsonwebtoken";
import { err, ok, unsafe } from "@dannywrayuk/results";

type TokenSettings = {
  signingKey: string;
  timeout: number;
};

type TokenPayload = {
  sub: string;
  iss: string;
  sessionStarted: string;
} & Record<string, string | number | boolean>;

export const generateToken = (
  data: TokenPayload,
  tokenSettings: TokenSettings,
) =>
  jwt.sign(data, tokenSettings.signingKey, {
    expiresIn: tokenSettings.timeout,
  });

export const readToken = (token: string | undefined) => {
  if (!token) {
    return err("no token provided");
  }
  const [decoded, decodeError] = unsafe(jwt.decode)(token);
  if (decodeError) {
    return err(decodeError, "decoding token");
  }
  if (typeof decoded === "string") {
    return err("token decoded but returned string");
  }
  return ok(decoded);
};

export const verifyToken = (token: string, signingKey: string) => {
  const [decoded, decodeError] = unsafe(jwt.verify)(token, signingKey);
  if (decodeError) {
    return err(decodeError, "verifying token");
  }
  if (typeof decoded === "string") {
    return err("token verified but returned string");
  }
  return ok(decoded as unknown as TokenPayload);
};
