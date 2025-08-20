/*
    This file contains some super basic crud operations for DynamoDB.
    It does not intend to replace or abstract all the features of the sdk.
    If you need advanced features, you should use the sdk directly.
    But for quick prototyping these functions should be good enough to get you started.
*/
import {
  DeleteCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { dynamoDBClient } from "./clients/dynamodb";

export type DynamoDBElement = {
  [key: string]: string | number | boolean | null | undefined | DynamoDBElement;
};

type PutProps = {
  PK: string;
  SK?: string;
  data: DynamoDBElement;
};

export const dynamoDBPut =
  (tableName: string) =>
  async ({ PK, SK, data }: PutProps) => {
    const response = await dynamoDBClient.send(
      new PutCommand({
        TableName: tableName,
        Item: { PK, SK, ...data },
        ConditionExpression:
          "attribute_not_exists(PK) " +
          (SK ? "AND attribute_not_exists(SK)" : ""),
      }),
    );

    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error("Error putting item");
    }
  };

type QueryProps = {
  PK: string;
  SK?: string;
  rangeExpression?: string;
};

export const dynamoDBQuery =
  (tableName: string) =>
  async ({ PK, SK, rangeExpression }: QueryProps) => {
    const response = await dynamoDBClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression:
          "PK = :pk" +
          (SK
            ? rangeExpression
              ? ` AND ${rangeExpression}`
              : " AND begins_with(SK, :sk)"
            : ""),
        ExpressionAttributeValues: { ":pk": PK, ":sk": SK },
      }),
    );

    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error("Error querying item");
    }

    return response.Items;
  };

type UpdateProps = {
  PK: string;
  SK?: string;
  data: DynamoDBElement;
};

export const dynamoDBUpdate =
  (tableName: string) =>
  async ({ PK, SK, data }: UpdateProps) => {
    const response = await dynamoDBClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { PK, SK },
        UpdateExpression: Object.keys(data)
          .map((key) => `SET #${key} = :${key}`)
          .join(", "),
        ExpressionAttributeValues: Object.fromEntries(
          Object.entries(data).map(([key, value]) => [`:${key}`, value]),
        ),
        ConditionExpression:
          "attribute_exists(PK) " + SK ? "AND attribute_exists(SK)" : "",
      }),
    );

    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error("Error updating item");
    }
  };

type DeleteProps = {
  PK: string;
  SK?: string;
};

export const dynamoDBDelete =
  (tableName: string) =>
  async ({ PK, SK }: DeleteProps) => {
    const response = await dynamoDBClient.send(
      new DeleteCommand({ TableName: tableName, Key: { PK, SK } }),
    );

    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error("Error deleting item");
    }
  };
