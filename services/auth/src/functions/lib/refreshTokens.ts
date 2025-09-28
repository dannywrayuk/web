import { AsyncResult, err, ok, Result } from "./results";

export const refreshTokens =
  ({
    accessToken,
    refreshToken,
    verifyRefreshToken,
    findUserById,
  }: {
    accessToken: (userId: string, sessionStarted: string) => string;
    refreshToken: (userId: string, sessionStarted: string) => string;
    verifyRefreshToken: (
      token: string,
    ) => Result<{ sub: string; sessionStarted: string }>;
    findUserById: (id: string) => AsyncResult<{ USER_ID: string } | null>;
  }) =>
  async (body: { refresh_token: string }) => {
    if (!body.refresh_token) {
      return err("Missing refresh_token");
    }

    const [tokenData, tokenError] = verifyRefreshToken(body.refresh_token);

    if (tokenError) {
      return err(tokenError, "verifying refresh token");
    }

    const [user, findUserError] = await findUserById(tokenData.sub);

    if (findUserError) {
      return err(findUserError, "finding user from token sub");
    }

    if (!user) {
      return err("User not found");
    }

    const access_token = accessToken(user.USER_ID, tokenData.sessionStarted);
    const refresh_token = refreshToken(user.USER_ID, tokenData.sessionStarted);

    return ok({
      access_token,
      refresh_token,
    });
  };
