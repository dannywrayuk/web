import { getSecrets } from "../lib/getSecrets";
import * as jwt from "jsonwebtoken";
import { safely } from "../lib/safely";

export const handler = async (event) => {
  const secrets = await getSecrets({
    accessTokenSigningKey: "AUTH_ACCESS_TOKEN_SIGNING_KEY",
    refreshTokenSigningKey: "AUTH_REFRESH_TOKEN_SIGNING_KEY",
  });
  const accessToken = event.headers.accessToken;
  const refreshToken = event.headers.refreshToken;

  if (!accessToken) {
    return {};
  }

  const test = async () => await fetch("https://api.example.com/user");
  const testing2 = await safely(test)();
  if (!testing2.success) {
    return testing2.error;
  }
  const d = testing2.data;
  const testing = safely(() =>
    jwt.verify(accessToken, secrets.accessTokenSigningKey),
  )<TypeError>();
  if (!testing.success) {
    return testing.error.message;
  }

  const x = testing.data;
  const refreshTokenData = jwt.verify(
    refreshToken,
    secrets.refreshTokenSigningKey,
  );

  return "Hello!";
};
