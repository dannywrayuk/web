import * as jwt from "jsonwebtoken";
import { getSecrets } from "@dannywrayuk/aws/getSecrets";
import { failure, success } from "./lib/results";
import { safe } from "../lib/safe/safe";
import { getCookies } from "@dannywrayuk/aws/getCookies";
import { buildAuthCookies } from "./lib/buildAuthCookies";
import { dynamoDBTableCRUD } from "@dannywrayuk/aws/dynamoDBTable";
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

  const userQuery = await userTable.read(
    `USER_ID#${refreshTokenData.userId}`,
    "RECORD",
  );
  if (!userQuery?.length) {
    return failure();
  }
  const user = userQuery[0];

  const authCookies = buildAuthCookies(user.USER_ID);
  return success("hello", {
    cookies: authCookies,
  });
};
