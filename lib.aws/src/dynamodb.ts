import {
  DeleteCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { dynamoDBClient } from "./clients/dynamodb.ts";
import { unsafe, err, ok } from "@dannywrayuk/results";

export const query = async <I>(input: {
  PK: string;
  SK?: string;
  tableName: string;
}) => {
  const [response, responseError] = await unsafe((command: QueryCommand) =>
    dynamoDBClient.send(command),
  )(
    new QueryCommand({
      TableName: input.tableName,
      ExpressionAttributeValues: { ":pk": input.PK, ":sk": input.SK },
      KeyConditionExpression:
        `${input.PK} = :pk` +
        (input.SK ? ` AND begins_with(${input.SK}, :sk)` : ""),
    }),
  );

  if (responseError) {
    return err(responseError, "querying item from table");
  }

  if (response.$metadata.httpStatusCode !== 200) {
    return err(null, "query returned non-200 status code");
  }
  if (!response.Items || response?.Items?.length === 0) {
    return ok(null);
  }
  return ok(response.Items as I[]);
};

export const put = async (input: {
  PK: string;
  SK: string;
  data: Record<string, unknown>;
  tableName: string;
}) => {
  const [response, responseError] = await unsafe((command: PutCommand) =>
    dynamoDBClient.send(command),
  )(
    new PutCommand({
      TableName: input.tableName,
      ConditionExpression:
        "attribute_not_exists(PK) AND attribute_not_exists(SK)",
      Item: { PK: input.PK, SK: input.SK, ...input.data },
    }),
  );

  if (responseError) {
    return err(responseError, "putting item into table");
  }

  if (response.$metadata.httpStatusCode !== 200) {
    return err(null, "put returned non-200 status code");
  }
  return ok(response);
};

export const deleter = async (input: {
  PK: string;
  SK: string;
  tableName: string;
}) => {
  const [response, responseError] = await unsafe((command: DeleteCommand) =>
    dynamoDBClient.send(command),
  )(
    new DeleteCommand({
      TableName: input.tableName,
      Key: { PK: input.PK, SK: input.SK },
      ConditionExpression: "attribute_exists(PK) AND attribute_exists(SK)",
    }),
  );

  if (responseError) {
    return err(responseError, "deleting item from table");
  }

  if (response.$metadata.httpStatusCode !== 200) {
    return err(null, "delete returned non-200 status code");
  }
  return ok(response);
};

export const update = async (input: {
  PK: string;
  SK: string;
  data: Record<string, unknown>;
  tableName: string;
}) => {
  const [response, responseError] = await unsafe((command: UpdateCommand) =>
    dynamoDBClient.send(command),
  )(
    new UpdateCommand({
      TableName: input.tableName,
      Key: { PK: input.PK, SK: input.SK },
      UpdateExpression: Object.keys(input.data)
        .map((key) => `SET #${key} = :${key}`)
        .join(", "),
      ExpressionAttributeValues: Object.fromEntries(
        Object.entries(input.data).map(([key, value]) => [`:${key}`, value]),
      ),
      ConditionExpression: "attribute_exists(PK) AND attribute_exists(SK)",
    }),
  );

  if (responseError) {
    return err(responseError, "updating item in table");
  }

  if (response.$metadata.httpStatusCode !== 200) {
    return err(null, "update returned non-200 status code");
  }
  return ok(response);
};

export const read = async <I>(input: {
  PK: string;
  SK: string;
  tableName: string;
}) => {
  const [response, responseError] = await unsafe((command: QueryCommand) =>
    dynamoDBClient.send(command),
  )(
    new QueryCommand({
      TableName: input.tableName,
      ExpressionAttributeValues: { ":pk": input.PK, ":sk": input.SK },
      KeyConditionExpression: `${input.PK} = :pk AND ${input.SK} = :sk`,
    }),
  );

  if (responseError) {
    return err(responseError, "reading item from table");
  }

  if (response.$metadata.httpStatusCode !== 200) {
    return err(null, "read returned non-200 status code");
  }
  return ok((response.Items?.[0] as I) || null);
};
