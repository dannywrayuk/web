import { dynamoDBClient } from "@dannywrayuk/aws/clients/dynamodb";
import { QueryCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

export const removeUserFromDb = async (tableName: string, userId: string) => {
  const userEntries = await dynamoDBClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": `USER_ID#${userId}` },
    }),
  );

  const userMappingEntries = await dynamoDBClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "PKSKInverse",
      KeyConditionExpression: "SK = :pk",
      ExpressionAttributeValues: { ":pk": `USER_Id#${userId}` },
    }),
  );

  const entries = [
    ...(userEntries.Items || []),
    ...(userMappingEntries.Items || []),
  ];

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
