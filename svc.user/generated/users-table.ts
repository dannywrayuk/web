// This file is auto-generated. Do not edit directly.

import {
  query,
  put,
  read,
  update,
  deleter,
} from "@dannywrayuk/aws/dynamodb";


export type UserRecord = {
  userId: string;
  name?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  createdAt?: string;
  githubId?: string;
}

// List by PK
export const usersListBy_userId = (userId: string) =>
  query<UserRecord>({ 
    PK: `userId#${userId}`,
    tableName: "users",
  });

// Create PK SK
export const usersCreateUserRecord = (data: UserRecord) =>
  put({
    PK: `userId#${data.userId}`,
    SK: "RECORD",
    data,
    tableName: "users",
  });

// Update PK SK
export const usersUpdateUserRecord = (data: UserRecord) =>
  update({
    PK: `userId#${data.userId}`,
    SK: "RECORD",
    data,
    tableName: "users",
  });

// Read PK SK
export const usersReadUserRecord = (userId: string) =>
  read<UserRecord>({
    PK: `userId#${userId}`,
    SK: "RECORD",
    tableName: "users",
  });

// Delete PK SK
export const usersDeleteUserRecord = (userId: string) =>
  deleter({
    PK: `userId#${userId}`,
    SK: "RECORD",
    tableName: "users",
  });


export type GithubLink = {
  userId: string;
  githubId: string;
}

// List by PK
export const usersListBy_githubId = (githubId: string) =>
  query<GithubLink>({ 
    PK: `githubId#${githubId}`,
    tableName: "users",
  });

// Create PK SK
export const usersCreateGithubLink = (data: GithubLink) =>
  put({
    PK: `githubId#${data.githubId}`,
    SK: `userId#${data.userId}}`,
    data,
    tableName: "users",
  });

// Update PK SK
export const usersUpdateGithubLink = (data: GithubLink) =>
  update({
    PK: `githubId#${data.githubId}`,
    SK: `userId#${data.userId}}`,
    data,
    tableName: "users",
  });

// Read PK SK
export const usersReadGithubLink = (githubId: string, userId: string) =>
  read<GithubLink>({
    PK: `githubId#${githubId}`,
    SK: `userId#${userId}}`,
    tableName: "users",
  });

// Delete PK SK
export const usersDeleteGithubLink = (githubId: string, userId: string) =>
  deleter({
    PK: `githubId#${githubId}`,
    SK: `userId#${userId}}`,
    tableName: "users",
  });
