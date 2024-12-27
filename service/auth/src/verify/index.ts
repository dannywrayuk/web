import { getSecrets } from "../lib/getSecrets";
import * as jwt from "jsonwebtoken";
import { safe } from "../lib/safe/safe";

export const handler = async (event: any) => {
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
  const safeTest = safe(test);
  const testing2 = await safeTest();
  if (testing2.error) {
    return;
  }
  const d = testing2.result;
  const testing = safe(
    () => jwt.verify(accessToken, secrets.accessTokenSigningKey),
    "hello",
  )<TypeError>();
  if (testing.error) {
    return testing.error.message;
  }

  const x = testing.result;

  const test3 = await safe(test, undefined)();
  test3.result;
  if (test3.error) {
    return;
  }
  const refreshTokenData = jwt.verify(
    refreshToken,
    secrets.refreshTokenSigningKey,
  );

  return "Hello!";
};
