import { getCookies } from "@dannywrayuk/aws/getCookies";
import { readToken } from "../lib/readToken";
import { failure, success } from "../lib/results";
import { safe } from "@dannywrayuk/safe";
import { readUsersEntry, usersTableName } from "./meDelete.gen";
import { dynamoDBClient } from "@dannywrayuk/aws/clients/dynamodb";
import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

export const removeUserFromDb = async (tableName: string, userId: string) => {
  const userEntries = await readUsersEntry({ PK: `USER_ID#${userId}` });
  const userMappingEntries = await readUsersEntry({
    PK: `USER_ID#${userId}`,
    indexName: "Inverse",
  });
  const entries = [...(userEntries || []), ...(userMappingEntries || [])];

  if (entries.length) {
    await dynamoDBClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: entries.map((entry) => ({
            DeleteRequest: {
              Key: { PK: entry.PK, SK: entry.SK },
            },
          })),
        },
      }),
    );
  }
};

const hourInSeconds = 60 * 60;

export const handler = async (event: any) => {
  const tokenPayload = event.requestContext.authorizer.lambda.tokenPayload;
  const sessionLength = Date.now() / 1000 - tokenPayload.sessionStarted;

  if (sessionLength > hourInSeconds) {
    console.log({ message: "Session too old", sessionLength });
    return failure();
  }

  const removeUser = await safe(async () => {
    const userEntries = await readUsersEntry({
      PK: `USER_ID#${tokenPayload.sub}`,
    });
    const userMappingEntries = await readUsersEntry({
      PK: `USER_ID#${tokenPayload.sub}`,
      indexName: "Inverse",
    });
    const entries = [...(userEntries || []), ...(userMappingEntries || [])];

    if (entries.length) {
      await dynamoDBClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [usersTableName]: entries.map((entry) => ({
              DeleteRequest: {
                Key: { PK: entry.PK, SK: entry.SK },
              },
            })),
          },
        }),
      );
    }
  })();

  if (removeUser.error) {
    console.error({
      message: "Failed to delete user",
      error: removeUser.error,
    });

    return failure();
  }

  const cookies = getCookies(event, ["access_token", "refresh_token"] as const);

  const accessTokenData = readToken(cookies.access_token);
  const refreshTokenData = readToken(cookies.refresh_token);

  const clearCookies = [];
  if (!accessTokenData.error && accessTokenData.result?.iss) {
    clearCookies.push(
      [
        `access_token=loggedOut`,
        `Max-Age=-1`,
        `Domain=${accessTokenData.result?.iss}`,
        "HttpOnly",
        "Secure",
        "SameSite=Strict",
        "Path=/",
      ].join("; "),
    );
  }

  if (!refreshTokenData.error && refreshTokenData.result?.iss) {
    clearCookies.push(
      [
        `refresh_token=loggedOut`,
        `Max-Age=-1`,
        "HttpOnly",
        "Secure",
        "SameSite=Strict",
        "Path=/",
      ].join("; "),
    );
  }
  return success("bye", { cookies: clearCookies });
};
