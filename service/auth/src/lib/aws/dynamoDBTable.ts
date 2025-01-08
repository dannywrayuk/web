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

type DynamoDBElement = {
  [key: string]: string | number | boolean | null | undefined | DynamoDBElement;
};

type PutProps = {
  tableName: string;
  PK: string;
  SK: string;
  data: DynamoDBElement;
};

export const dynamoDBPut = async ({ tableName, data }: PutProps) => {
  const response = await dynamoDBClient.send(
    new PutCommand({
      TableName: tableName,
      Item: data,
      ConditionExpression:
        "attribute_exists(PK) " + data.SK ? "AND attribute_exists(SK)" : "",
    }),
  );

  if (response.$metadata.httpStatusCode !== 200) {
    throw new Error("Error putting item");
  }
};

type QueryProps = {
  tableName: string;
  PK: string;
  SK?: string;
};

export const dynamoDBQuery = async ({ tableName, PK, SK }: QueryProps) => {
  const response = await dynamoDBClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk," + SK ? "SK = :sk" : "",
      ExpressionAttributeValues: { ":pk": PK, ":sk": SK },
    }),
  );

  if (response.$metadata.httpStatusCode !== 200) {
    throw new Error("Error querying item");
  }

  return response.Items;
};

type UpdateProps = {
  tableName: string;
  PK: string;
  SK: string;
  data: DynamoDBElement;
};

export const dynamoDBUpdate = async ({
  tableName,
  PK,
  SK,
  data,
}: UpdateProps) => {
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
  tableName: string;
  PK: string;
  SK: string;
};

export const dynamoDBDelete = async ({ tableName, PK, SK }: DeleteProps) => {
  const response = await dynamoDBClient.send(
    new DeleteCommand({ TableName: tableName, Key: { PK, SK } }),
  );

  if (response.$metadata.httpStatusCode !== 200) {
    throw new Error("Error deleting item");
  }
};

export const dynamoDBTableCRUD = (tableName: string) => {
  return {
    create: (PK: string, SK: string, data: DynamoDBElement) =>
      dynamoDBPut({ tableName, PK, SK, data }),
    read: (PK: string, SK?: string) => dynamoDBQuery({ tableName, PK, SK }),
    update: (PK: string, SK: string, data: DynamoDBElement) =>
      dynamoDBUpdate({ tableName, PK, SK, data }),
    delete: (PK: string, SK: string) => dynamoDBDelete({ tableName, PK, SK }),
  };
};
