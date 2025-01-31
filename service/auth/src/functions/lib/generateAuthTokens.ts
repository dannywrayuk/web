import * as jwt from "jsonwebtoken";

type Options = {
  userId: string;
  expiresIn: number;
};

export const generateAuthTokens = ({ userId, expiresIn }: Options) => {
  const token = jwt.sign({ userId }, "privateKey", {
    expiresIn,
  });

  return token;
};
