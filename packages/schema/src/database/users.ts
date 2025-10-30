import { Table } from "@dannywrayuk/aws/dynamoDBTable";
import { AsyncResult, err, ok } from "@dannywrayuk/results";
import { z } from "zod";

const externalNames = ["GITHUB"] as const;

type ExternalName = (typeof externalNames)[number];

export const userRecord = z.object({
  USER_ID: z.string(),
  EMAIL: z.string(),
  USERNAME: z.string(),
  NAME: z.string(),
  AVATAR_URL: z.string(),
  CREATED_AT: z.string(),
  ...externalNames.reduce(
    (acc, name) => {
      acc[`${name}_ID`] = z.string().optional();
      return acc;
    },
    {} as Record<`${ExternalName}_ID`, z.ZodOptional<z.ZodString>>,
  ),
});

export type UserRecord = z.infer<typeof userRecord>;

export const readUserRecord =
  (table: Table) =>
  async (input: { userId: string }): AsyncResult<UserRecord | null> => {
    const [rsp, queryError] = await table.query({
      PK: `USER_ID#${input.userId}`,
      SK: "RECORD",
    });
    if (queryError) {
      return err(queryError, "querying for userRecord");
    }
    if (!rsp.Items?.length) {
      return ok(null);
    }
    const { data, error } = userRecord.safeParse(rsp.Items?.[0]);
    if (error) {
      return err(error.message, "validating userRecord");
    }
    return ok(data);
  };

export const createUserRecord =
  (table: Table) =>
  async (
    input: UserRecord,
  ): AsyncResult<Awaited<ReturnType<Table["put"]>>[0]> => {
    const { data, error } = userRecord.safeParse(input);
    if (error) {
      return err(error.message, "validating userRecord");
    }
    const [rsp, putError] = await table.put({
      Item: { PK: `USER_ID#${data.USER_ID}`, SK: "RECORD", ...data },
    });
    if (putError) {
      return err(putError, "creating userRecord");
    }
    return ok(rsp);
  };

export const userExternalLink = (externalName: ExternalName) => {
  const externalIdKey = `${externalName}_ID` as const;
  return z.object({
    USER_ID: z.string(),
    [externalIdKey]: z.string(),
  }) as z.ZodObject<{
    USER_ID: z.ZodString;
    [externalIdKey]: z.ZodString;
  }>;
};

export type UserExternalLink = z.infer<ReturnType<typeof userExternalLink>>;

export const readUserExternalLink =
  (table: Table) =>
  async (input: {
    externalName: ExternalName;
    externalId: string;
  }): AsyncResult<UserExternalLink | null> => {
    const [rsp, queryError] = await table.query({
      PK: `${input.externalName.toUpperCase()}_ID#${input.externalId}`,
    });
    if (queryError) {
      return err(queryError, "querying for userExternalLink");
    }
    if (!rsp.Items?.length) {
      return ok(null);
    }
    const { data, error } = userExternalLink(input.externalName).safeParse(
      rsp.Items[0],
    );
    if (error) {
      return err(error.message, "validating userExternalLink");
    }
    return ok(data);
  };

export const createUserExternalLink =
  (table: Table) =>
  async (input: {
    externalName: ExternalName;
    externalId: string;
    userId: string;
  }): AsyncResult<Awaited<ReturnType<Table["put"]>>[0]> => {
    const externalIdKey = `${input.externalName.toUpperCase()}_ID` as const;
    const { data, error } = userExternalLink(input.externalName).safeParse({
      USER_ID: input.userId,
      [externalIdKey]: input.externalId,
    });
    if (error) {
      return err(error.message, "validating userExternalLink");
    }
    const [rsp, putError] = await table.put({
      Item: {
        PK: `${externalIdKey}#${data[externalIdKey]}`,
        SK: `USER_ID#${data.USER_ID}`,
        ...data,
      },
    });
    if (putError) {
      return err(putError, "creating userExternalLink");
    }
    return ok(rsp);
  };

export const deleteUser =
  (table: Table) =>
  async (input: { userId: string }): AsyncResult<null> => {
    const [userEntries, userEntriesError] = await table.query({
      PK: `USER_ID#${input.userId}`,
    });

    if (userEntriesError) {
      return err(userEntriesError, "querying for user entries to delete");
    }

    const [userEntriesInverse, userEntriesInverseError] = await table.query({
      PK: `USER_ID#${input.userId}`,
      inverse: true,
    });

    if (userEntriesInverseError) {
      return err(
        userEntriesInverseError,
        "querying for inverse user entries to delete",
      );
    }

    const entries = [
      ...(userEntries?.Items || []),
      ...(userEntriesInverse?.Items || []),
    ];

    if (entries.length) {
      const [, batchDeleteError] = await table.batchWrite(
        entries.map((entry) => ({
          DeleteRequest: {
            Key: { PK: entry.PK, SK: entry.SK },
          },
        })),
      );
      if (batchDeleteError) {
        return err(batchDeleteError, "deleting user entries");
      }
    }
    return ok(null);
  };
