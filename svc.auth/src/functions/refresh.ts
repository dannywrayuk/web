import { serviceFunction } from "@dannywrayuk/service-platform/serviceFunction";
import { Env } from "../../generated/config.ts";
import { refresh } from "../../handlers.ts";
import { signToken, verifyToken } from "@dannywrayuk/jwt";
import { err, ok } from "@dannywrayuk/results";
import { readUserById } from "@dannywrayuk/svc.user/handlers.ts";

export const handler = serviceFunction<Env>()(
  refresh,
  async (event, { secrets, env }) => {

    const [verifiedToken, verifyTokenError] = verifyToken(
      event.refreshToken,
      secrets.AUTH_REFRESH_TOKEN_SIGNING_KEY,
    );

    if (verifyTokenError) {
      return err(verifyTokenError, "verifying refresh token");
    }

    const [userRecord, userRecordError] = await readUserById.call({ userId: verifiedToken.sub });

    if (userRecordError) {
      return err(userRecordError, "getting user record by id");
    }

    if (!userRecord) {
      return err(null, "no user found with id from refresh token", "not-found");
    }

    const [accessToken, accessTokenError] = signToken(
      {
        sub: verifiedToken.sub,
        iss: verifiedToken.iss,
        started: verifiedToken.started,
      },
      {
        signingKey: secrets.AUTH_ACCESS_TOKEN_SIGNING_KEY,
        timeout: env.authTokenTimeouts.accessToken,
      },
    );

    if (accessTokenError) {
      return err(accessTokenError, "signing access token");
    }

    const [refreshToken, refreshTokenError] = signToken(
      {
        sub: verifiedToken.sub,
        iss: verifiedToken.iss,
        started: verifiedToken.started,
      },
      {
        signingKey: secrets.AUTH_REFRESH_TOKEN_SIGNING_KEY,
        timeout: env.authTokenTimeouts.refreshToken,
      },
    );

    if (refreshTokenError) {
      return err(refreshTokenError, "signing refresh token");
    }

    return ok({
      accessToken,
      refreshToken,
    });
  })
