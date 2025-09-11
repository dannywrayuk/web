import { getCookies } from "@dannywrayuk/aws/getCookies";
import { buildAuthCookies } from "./lib/buildAuthCookies";
import { calculateCookieDomain } from "./lib/calculateCookieDomain";
import { failure, success } from "./lib/results";
import { verifyToken } from "./lib/verifyToken";
import { getSecrets, env, readUsersEntry } from "./refresh.gen";

export const handler = async (event: any) => {
  const secrets = await getSecrets();

  const tokenSettings = {
    accessToken: {
      signingKey: secrets.AUTH_ACCESS_TOKEN_SIGNING_KEY,
      timeout: env.authTokenTimeouts.accessToken,
    },
    refreshToken: {
      signingKey: secrets.AUTH_REFRESH_TOKEN_SIGNING_KEY,
      timeout: env.authTokenTimeouts.refreshToken,
    },
  };

  const cookies = getCookies(event, ["access_token", "refresh_token"] as const);

  if (!cookies.refresh_token) {
    console.log("No refresh token found in cookies");
    return failure();
  }

  const refreshTokenVerified = verifyToken(
    cookies.refresh_token,
    secrets.AUTH_REFRESH_TOKEN_SIGNING_KEY,
  );

  if (refreshTokenVerified.error) {
    console.log("Error verifying refresh token", refreshTokenVerified.error);
    return failure();
  }

  const refreshTokenData = refreshTokenVerified.result;

  const userQuery = await readUsersEntry({
    PK: `USER_ID#${refreshTokenData.sub}`,
    SK: "RECORD",
  });

  if (!userQuery?.length) {
    console.log("User not found");
    return failure();
  }

  const cookieDomain = calculateCookieDomain(
    env.stage,
    event.headers?.stage,
    env.cookieStages,
    env.domainName,
  );
  const user = userQuery[0];

  const authCookies = buildAuthCookies(
    {
      sub: user.USER_ID,
      iss: cookieDomain,
      sessionStarted: refreshTokenData.sessionStarted,
    },
    tokenSettings,
  );

  return success("hello", {
    cookies: authCookies,
  });
};
