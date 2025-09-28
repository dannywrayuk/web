import { randomUUID } from "node:crypto";
import { err, ok, unsafe } from "./results";

export const findUserIdByExternalId =
  ({
    readUsersEntry,
    externalName,
  }: {
    readUsersEntry: (query: { PK: string; SK: string }) => Promise<any>;
    externalName: string;
  }) =>
  async (externalId: string) => {
    const [entries, readError] = await unsafe(readUsersEntry)({
      PK: `${externalName}_ID#${externalId}`,
      SK: "USER_ID",
    });
    if (readError) {
      return err(readError, "querying for userId");
    }
    return ok(entries?.length ? (entries[0]?.USER_ID as string) : null);
  };

export const findUserById =
  ({
    readUsersEntry,
  }: {
    readUsersEntry: (query: { PK: string; SK: string }) => Promise<any>;
  }) =>
  async (userId: string) => {
    const [entries, readError] = await unsafe(readUsersEntry)({
      PK: `USER_ID#${userId}`,
      SK: "RECORD",
    });
    if (readError) {
      return err(readError, "querying for userRecord");
    }
    return ok(entries?.length ? entries[0] : null);
  };

export const createUser =
  ({
    createUsersEntry,
    externalName,
  }: {
    createUsersEntry: (query: any) => Promise<any>;
    externalName: string;
  }) =>
  async (externalUserData: any) => {
    const userId = randomUUID();

    const [, createUserError] = await unsafe(createUsersEntry)({
      PK: `USER_ID#${userId}`,
      SK: "RECORD",
      data: {
        USER_ID: userId,
        EMAIL: externalUserData.email,
        USERNAME: externalUserData.username,
        NAME: externalUserData.name,
        AVATAR_URL: externalUserData.avatar_url,
        CREATED_AT: new Date().toISOString(),
        [`${externalName}_ID`]: externalUserData.id,
      },
    });

    if (createUserError) {
      return err(createUserError, "creating user record");
    }

    const [, linkExternalUserError] = await unsafe(createUsersEntry)({
      PK: `${externalName}_ID#${externalUserData.id}`,
      SK: "USER_ID#" + userId,
      data: {
        USER_ID: userId,
        [`${externalName}_ID`]: externalUserData.id,
      },
    });

    if (linkExternalUserError) {
      return err(linkExternalUserError, "linking external user ID");
    }
    return ok(userId);
  };
