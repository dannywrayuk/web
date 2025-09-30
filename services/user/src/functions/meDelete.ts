import { ok, error } from "@dannywrayuk/responses";
import { readUsersEntry, usersTableName } from "./meDelete.gen";
import { dynamoDBClient } from "@dannywrayuk/aws/clients/dynamodb";
import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { unsafe } from "@dannywrayuk/results";

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
    return error();
  }

  const [_, removeUserError] = await unsafe(async () => {
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

  if (removeUserError) {
    return error();
  }

  return ok("bye", {
    cookies: [
      `refresh_token=invalid; Max-Age=-1; Path=/refresh; HttpOnly; SameSite=None; Secure;`,
    ],
  });
};
