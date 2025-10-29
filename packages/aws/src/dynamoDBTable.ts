import { ok, err, unsafe } from "@dannywrayuk/results";
import {
  BatchWriteCommand,
  BatchWriteCommandInput,
  DeleteCommand,
  DeleteCommandInput,
  PutCommand,
  PutCommandInput,
  QueryCommand,
  QueryCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { dynamoDBClient } from "./clients/dynamodb";

export const table = (tableName: string) => ({
  put: async (input: Omit<PutCommandInput, "TableName">) => {
    const [response, responseError] = await unsafe((command: PutCommand) =>
      dynamoDBClient.send(command),
    )(
      new PutCommand({
        TableName: tableName,
        ConditionExpression:
          "attribute_not_exists(PK) " +
          (input.Item?.SK ? "AND attribute_not_exists(SK)" : ""),
        ...input,
      }),
    );

    if (responseError) {
      return err(responseError, "putting item into table");
    }

    if (response.$metadata.httpStatusCode !== 200) {
      return err("put returned non-200 status code");
    }
    return ok(response);
  },
  query: async (
    input: { PK: string; SK?: string; rangeExpression?: string } & Omit<
      QueryCommandInput,
      "TableName"
    >,
  ) => {
    const [response, responseError] = await unsafe((command: QueryCommand) =>
      dynamoDBClient.send(command),
    )(
      new QueryCommand({
        TableName: tableName,
        ExpressionAttributeValues: { ":pk": input.PK, ":sk": input.SK },
        KeyConditionExpression:
          "PK = :pk" +
          (input.SK
            ? input.rangeExpression
              ? ` AND ${input.rangeExpression}`
              : " AND begins_with(SK, :sk)"
            : ""),
        ...input,
      }),
    );

    if (responseError) {
      return err(responseError, "querying item from table");
    }

    if (response.$metadata.httpStatusCode !== 200) {
      return err("query returned non-200 status code");
    }
    return ok(response);
  },
  update: async (
    input: { Item: { PK: string; SK?: string } } & Omit<
      UpdateCommandInput,
      "TableName" | "Key"
    >,
  ) => {
    const { PK, SK, ...data } = input.Item;
    const [response, responseError] = await unsafe((command: UpdateCommand) =>
      dynamoDBClient.send(command),
    )(
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
        ...input,
      }),
    );

    if (responseError) {
      return err(responseError, "updating item in table");
    }

    if (response.$metadata.httpStatusCode !== 200) {
      return err("update returned non-200 status code");
    }
    return ok(response);
  },
  delete: async (
    input: { PK: string; SK?: string } & Omit<
      DeleteCommandInput,
      "TableName" | "Key"
    >,
  ) => {
    const [response, responseError] = await unsafe((command: DeleteCommand) =>
      dynamoDBClient.send(command),
    )(
      new DeleteCommand({
        TableName: tableName,
        Key: { PK: input.PK, SK: input.SK },
        ConditionExpression:
          "attribute_exists(PK) " + input.SK ? "AND attribute_exists(SK)" : "",
        ...input,
      }),
    );

    if (responseError) {
      return err(responseError, "deleting item from table");
    }

    if (response.$metadata.httpStatusCode !== 200) {
      return err("delete returned non-200 status code");
    }
    return ok(response);
  },
  batchWrite: async (
    items: NonNullable<BatchWriteCommandInput["RequestItems"]>[string],
  ) => {
    const [response, responseError] = await unsafe(
      (command: BatchWriteCommand) => dynamoDBClient.send(command),
    )(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: items,
        },
      }),
    );

    if (responseError) {
      return err(responseError, "batch writing to table");
    }

    if (response.$metadata.httpStatusCode !== 200) {
      return err("batchWrite returned non-200 status code");
    }
    return ok(response);
  },
});

export type Table = ReturnType<typeof table>;
