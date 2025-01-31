import * as jwt from "jsonwebtoken";
import { getSecrets } from "../lib/aws/getSecrets";
import { failure, success } from "./lib/results";
import { safe } from "../lib/safe/safe";
import { getCookies } from "../lib/aws/getCookies";
import { buildAuthCookies } from "./lib/buildAuthCookies";
import { dynamoDBTableCRUD } from "../lib/aws/dynamoDBTable";
import { LambdaEnv } from "./refresh-env.gen";

const env = process.env as LambdaEnv;

const userTable = dynamoDBTableCRUD(env.USER_TABLE_NAME);

const verifyToken = safe((token: string, signingKey: string) => {
  const decoded = jwt.verify(token, signingKey);
  if (typeof decoded === "string") {
    throw new Error("Invalid token");
  }
  return decoded;
});

export const handler = async (event: any) => {
  const { accessTokenSigningKey, refreshTokenSigningKey } = await getSecrets({
    accessTokenSigningKey: "AUTH_ACCESS_TOKEN_SIGNING_KEY",
    refreshTokenSigningKey: "AUTH_REFRESH_TOKEN_SIGNING_KEY",
  });

  const cookies = getCookies(event, {
    accessToken: "access_token",
    refreshToken: "refresh_token",
  });

  if (!cookies.refreshToken) {
    return failure();
  }

  const refreshTokenVerified = verifyToken(
    cookies.refreshToken,
    refreshTokenSigningKey,
  );

  if (refreshTokenVerified.error) {
    return failure();
  }

  const refreshTokenData = refreshTokenVerified.result;

  const user = await userTable.read(
    `USER_ID#${refreshTokenData.userId}`,
    "RECORD",
  );
  if (user?.length !== 1) {
    return failure();
  }

  const authCookies = buildAuthCookies(user[0].PK.split("#")[1]);
  return success("hello", {
    cookies: authCookies,
  });
};
