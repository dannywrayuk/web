import * as jwt from "jsonwebtoken";
import { err, ok, unsafe } from "@dannywrayuk/results";

type TokenSettings = {
  signingKey: string;
  timeout: number;
};

type TokenPayload = {
  sub: string;
  iss: string;
} & Record<string, string | number | boolean>;

export const signToken = (data: TokenPayload, tokenSettings: TokenSettings) => {
  const [signingResponse, signingError] = unsafe(
    // Types are behaving weirdly here
    jwt.sign as (data: object, key: string, opts: object) => string,
  )(data, tokenSettings.signingKey, {
    expiresIn: tokenSettings.timeout,
  });
  if (signingError) {
    return err(signingError, "signing token");
  }
  return ok(signingResponse);
};

export const readToken = (token: string | undefined) => {
  if (!token) {
    return err(null, "no token provided");
  }
  const [decoded, decodeError] = unsafe(jwt.decode)(token);
  if (decodeError) {
    return err(decodeError, "decoding token");
  }
  if (typeof decoded === "string") {
    return err(null, "token decoded but returned string");
  }
  return ok(decoded);
};

export const verifyToken = (token: string, signingKey: string) => {
  const [decoded, decodeError] = unsafe(jwt.verify)(token, signingKey);
  if (decodeError) {
    return err(decodeError, "verifying token");
  }
  if (typeof decoded === "string") {
    return err(null, "token verified but returned string");
  }
  return ok(decoded as unknown as TokenPayload);
};
