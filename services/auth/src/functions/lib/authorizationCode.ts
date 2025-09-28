import { AsyncResult, err, ok } from "./results";

export const authorizationCode =
  ({
    getExternalAccessToken,
    getUserInfo,
    getPrimaryEmail,
    findUserIdByExternalId,
    createUser,
    accessToken,
    refreshToken,
  }: {
    getExternalAccessToken: (code: string) => AsyncResult<string>;
    getUserInfo: (code: string) => AsyncResult<{ id: string }>;
    getPrimaryEmail: (accessToken: string) => AsyncResult<string>;
    findUserIdByExternalId: (externalId: string) => AsyncResult<string | null>;
    createUser: (userInfo: {
      id: string;
      email: string;
    }) => AsyncResult<string>;
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
      const [foundUser, foundUserError] = await findUserIdByExternalId(
        userInfo.id,
      );
      if (foundUserError) {
        return err(foundUserError);
      }
      if (foundUser) {
        return ok(foundUser);
      }
      const [primaryEmail, primaryEmailError] =
        await getPrimaryEmail(externalAccessToken);
      if (primaryEmailError) {
        return err(primaryEmailError);
      }

      const [createdUser, createUserError] = await createUser({
        ...userInfo,
        email: primaryEmail,
      });
      if (createUserError) {
        return err(createUserError);
      }
      return ok(createdUser);
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
