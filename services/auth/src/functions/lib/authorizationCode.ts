import crypto from "node:crypto";
import { AsyncResult, err, ok } from "@dannywrayuk/results";
import {
  UserExternalLink,
  UserRecord,
} from "@dannywrayuk/schema/database/users";

export const authorizationCode =
  ({
    getExternalAccessToken,
    getUserInfo,
    getPrimaryEmail,
    findUserByExternalLink,
    createUser,
    accessToken,
    refreshToken,
  }: {
    getExternalAccessToken: (code: string) => AsyncResult<string>;
    getUserInfo: (code: string) => AsyncResult<{
      EXTERNAL_ID: string;
      USERNAME: string;
      NAME: string;
      AVATAR_URL: string;
      EMAIL?: string;
    }>;
    getPrimaryEmail: (accessToken: string) => AsyncResult<string>;
    findUserByExternalLink: (
      externalId: string,
    ) => AsyncResult<UserExternalLink | null>;
    createUser: (
      userRecord: UserRecord & { EXTERNAL_ID: string },
    ) => AsyncResult<unknown>;
    accessToken: (userId: string) => string;
    refreshToken: (userId: string) => string;
  }) =>
  async (data: { code: string }) => {
    if (!data.code) {
      return err("Missing code");
    }
    const [externalAccessToken, externalAccessTokenError] =
      await getExternalAccessToken(data.code);
    if (externalAccessTokenError) {
      return err(externalAccessTokenError);
    }

    const [userInfo, userInfoError] = await getUserInfo(externalAccessToken);
    if (userInfoError) {
      return err(userInfoError);
    }

    const [userId, userError] = await (async () => {
      const [foundUser, foundUserError] = await findUserByExternalLink(
        userInfo.EXTERNAL_ID,
      );
      if (foundUserError) {
        return err(foundUserError);
      }
      if (foundUser) {
        return ok(foundUser.USER_ID);
      }

      const [primaryEmail, primaryEmailError] = userInfo.EMAIL
        ? ok(userInfo.EMAIL)
        : await getPrimaryEmail(externalAccessToken);
      if (primaryEmailError) {
        return err(primaryEmailError);
      }

      const userId = crypto.randomUUID();
      const [_, createUserError] = await createUser({
        USER_ID: userId,
        CREATED_AT: new Date().toISOString(),
        EMAIL: primaryEmail,
        ...userInfo,
      });
      if (createUserError) {
        return err(createUserError);
      }

      return ok(userId);
    })();

    if (userError) {
      return err(userError);
    }

    const access_token = accessToken(userId);
    const refresh_token = refreshToken(userId);

    return ok({
      access_token,
      refresh_token,
    });
  };
