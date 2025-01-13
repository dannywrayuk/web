import * as jwt from "jsonwebtoken";

export const generateAuthTokens = (userId: string) => {
  const access_token_max_age = 60 * 60 * 6;
  const refresh_token_max_age = 60 * 60 * 24 * 30;

  const access_token = jwt.sign({ userId }, "privateKey", {
    expiresIn: access_token_max_age,
  });
  const refresh_token = jwt.sign({ userId }, "privateKey", {
    expiresIn: refresh_token_max_age,
  });

  return {
    access_token,
    access_token_max_age,
    refresh_token,
    refresh_token_max_age,
  };
};
