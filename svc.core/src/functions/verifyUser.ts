import { env, getSecrets } from "./verifyUser.gen.ts";
import * as jwt from "jsonwebtoken";
import { unsafe } from "@dannywrayuk/results";
import { logger } from "@dannywrayuk/logger";

const verifyToken = unsafe((token: string, signingKey: string) => {
  const decoded = jwt.verify(token, signingKey);
  if (typeof decoded === "string") {
    throw new Error("Invalid token");
  }
  return decoded;
});

export const handler = async (event: any) => {
  logger
    .setDebug(env.stage === "dev")
    .attach({
      name: env.functionName,
      service: env.serviceName,
      stage: env.stage,
    })
    .debug("input", {
      identitySource: event.identitySource,
    })
    .info("start");
  const secrets = await getSecrets();
  const access_token = event.identitySource?.[0].split(" ")[1];
  if (!access_token) {
    logger.info("No access token provided");
    return { isAuthorized: false };
  }

  const [accessTokenVerified, accessTokenVerifiedError] = verifyToken(
    access_token,
    secrets.AUTH_ACCESS_TOKEN_SIGNING_KEY,
  );

  if (accessTokenVerifiedError) {
    logger.info("Error verifying access token", accessTokenVerifiedError);
    return { isAuthorized: false };
  }

  logger.debug("Access token verified", accessTokenVerified);

  return {
    isAuthorized: true,
    context: {
      tokenPayload: accessTokenVerified,
    },
  };
};
