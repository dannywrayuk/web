/* eslint-disable @typescript-eslint/no-explicit-any */
import { ok, err, type Result } from "@dannywrayuk/results";
import { methodHandler } from "@dannywrayuk/service-platform/methodHandler";
import { HandlerContext } from "@dannywrayuk/service-platform/HandlerContext";

export type CommonEnv = {domain:string;} & { stage: string };
export type Env_dev = {} & { stage: "dev" };
export type Env_prod = {deletionProtection:boolean;} & { stage: "prod" };
export type Env = CommonEnv & (Env_dev | Env_prod);

export type ReadUserRequest = {userId: string;};
export const validateReadUserRequest = (o: Record<string, any>): Result<ReadUserRequest> => {
    if (typeof o !== "object" || o === null) { return err(null, "ReadUserRequest is not an object") }
    if(typeof o.userId !== "string") { return err(null, "userId is not a string") }
      return ok(o as ReadUserRequest);
  }
export type UserDetails = {userId: string; name: string; username: string; avatarUrl: string; createdAt: string; email: string; githubId?: string | undefined;};
export const validateUserDetails = (o: Record<string, any>): Result<UserDetails> => {
    if (typeof o !== "object" || o === null) { return err(null, "UserDetails is not an object") }
    if(typeof o.userId !== "string") { return err(null, "userId is not a string") }
if(typeof o.name !== "string") { return err(null, "name is not a string") }
if(typeof o.username !== "string") { return err(null, "username is not a string") }
if(typeof o.avatarUrl !== "string") { return err(null, "avatarUrl is not a string") }
if(typeof o.createdAt !== "string") { return err(null, "createdAt is not a string") }
if(typeof o.email !== "string") { return err(null, "email is not a string") }

    if (o.githubId !== undefined) {
      if(typeof o.githubId !== "string") { return err(null, "githubId is not a string") }
    }
      return ok(o as UserDetails);
  }
export type ReadUserResponse = {user?: UserDetails | undefined;};
export const validateReadUserResponse = (o: Record<string, any>): Result<ReadUserResponse> => {
    if (typeof o !== "object" || o === null) { return err(null, "ReadUserResponse is not an object") }
    
      if (o.user !== undefined) {
      
    const [, userError] = validateUserDetails(o.user);
    if (userError) { return err(userError, "user is not valid") }
      }
      return ok(o as ReadUserResponse);
  }
export type ReadUserFromGithubRequest = {githubId: string;};
export const validateReadUserFromGithubRequest = (o: Record<string, any>): Result<ReadUserFromGithubRequest> => {
    if (typeof o !== "object" || o === null) { return err(null, "ReadUserFromGithubRequest is not an object") }
    if(typeof o.githubId !== "string") { return err(null, "githubId is not a string") }
      return ok(o as ReadUserFromGithubRequest);
  }
export type UserStarter = {name: string; username: string; avatarUrl: string; email: string;};
export const validateUserStarter = (o: Record<string, any>): Result<UserStarter> => {
    if (typeof o !== "object" || o === null) { return err(null, "UserStarter is not an object") }
    if(typeof o.name !== "string") { return err(null, "name is not a string") }
if(typeof o.username !== "string") { return err(null, "username is not a string") }
if(typeof o.avatarUrl !== "string") { return err(null, "avatarUrl is not a string") }
if(typeof o.email !== "string") { return err(null, "email is not a string") }
      return ok(o as UserStarter);
  }
export type CreateUserFromGithubRequest = {githubId: string; user: UserStarter;};
export const validateCreateUserFromGithubRequest = (o: Record<string, any>): Result<CreateUserFromGithubRequest> => {
    if (typeof o !== "object" || o === null) { return err(null, "CreateUserFromGithubRequest is not an object") }
    if(typeof o.githubId !== "string") { return err(null, "githubId is not a string") }

    const [, userError] = validateUserStarter(o.user);
    if (userError) { return err(userError, "user is not valid") }
      return ok(o as CreateUserFromGithubRequest);
  }


  export const readUser = (handler: (event: ReadUserRequest, context: HandlerContext<Env, []>) => Promise<Result<ReadUserResponse>>) => {
    return methodHandler(
      handler,
      [],
      validateReadUserRequest,
      validateReadUserResponse
    );
  }

  export const readUserFromGithub = (handler: (event: ReadUserFromGithubRequest, context: HandlerContext<Env, []>) => Promise<Result<ReadUserResponse>>) => {
    return methodHandler(
      handler,
      [],
      validateReadUserFromGithubRequest,
      validateReadUserResponse
    );
  }

  export const createUserFromGithub = (handler: (event: CreateUserFromGithubRequest, context: HandlerContext<Env, []>) => Promise<Result<ReadUserResponse>>) => {
    return methodHandler(
      handler,
      [],
      validateCreateUserFromGithubRequest,
      validateReadUserResponse
    );
  }

import {
  query,
  put,
  read,
  update,
  remove,
} from "@dannywrayuk/aws/dynamodb";

export const tableInformation = {
  tables: {
  "user": {
    "Record": {
      "PK": "$userId",
      "SK": "",
      "columns": [
        "userId",
        "name",
        "username",
        "avatarUrl",
        "createdAt",
        "email",
        "githubId"
      ]
    },
    "GithubMap": {
      "PK": "$userId",
      "SK": "$githubId",
      "columns": [
        "userId",
        "githubId"
      ]
    }
  }
},
};
  
export type UserRecord = {
  userId: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  createdAt?: string;
  email?: string;
  githubId?: string;
}


export const createUserRecord = (ctx: HandlerContext, data: UserRecord) =>
  put({
    PK: `RECORD#userId#${data.userId}`,
    SK: "RECORD",
    data,
    tableName: `user-user-${ctx.env.stage}`,
  });

export const updateUserRecord = (ctx: HandlerContext, data: UserRecord) =>
  update({
    PK: `RECORD#userId#${data.userId}`,
    SK: "RECORD",
    data,
    tableName: `user-user-${ctx.env.stage}`,
  });

export const readUserRecord = (ctx: HandlerContext, params: { userId: string }) =>
  read<UserRecord>({
    PK: `RECORD#userId#${params.userId}`,
    SK: "RECORD",
    tableName: `user-user-${ctx.env.stage}`,
  });

export const deleteUserRecord = (ctx: HandlerContext, params: { userId: string }) =>
  remove({
    PK: `RECORD#userId#${params.userId}`,
    SK: "RECORD",
    tableName: `user-user-${ctx.env.stage}`,
  });


export type UserGithubMap = {
  userId: string;
  githubId: string;
}

export const listUserGithubMapByUserId = (ctx: HandlerContext, params: { userId: string }) =>
  query<UserGithubMap>({ 
    PK: `GITHUB_MAP#userId#${params.userId}`,
    tableName: `user-user-${ctx.env.stage}`,
  });


export const listUserGithubMapByGithubId = (ctx: HandlerContext, params: { githubId: string }) =>
query<UserGithubMap>({ 
  PK: `GITHUB_MAP#githubId#${params.githubId}`,
    tableName: `user-user-${ctx.env.stage}`,
  inverse: true,
});

export const createUserGithubMap = (ctx: HandlerContext, data: UserGithubMap) =>
  put({
    PK: `GITHUB_MAP#userId#${data.userId}`,
    SK: `GITHUB_MAP#githubId#${data.githubId}`,
    data,
    tableName: `user-user-${ctx.env.stage}`,
  });

export const updateUserGithubMap = (ctx: HandlerContext, data: UserGithubMap) =>
  update({
    PK: `GITHUB_MAP#userId#${data.userId}`,
    SK: `GITHUB_MAP#githubId#${data.githubId}`,
    data,
    tableName: `user-user-${ctx.env.stage}`,
  });

export const readUserGithubMap = (ctx: HandlerContext, params: { userId: string, githubId: string }) =>
  read<UserGithubMap>({
    PK: `GITHUB_MAP#userId#${params.userId}`,
    SK: `GITHUB_MAP#githubId#${params.githubId}`,
    tableName: `user-user-${ctx.env.stage}`,
  });

export const deleteUserGithubMap = (ctx: HandlerContext, params: { userId: string, githubId: string }) =>
  remove({
    PK: `GITHUB_MAP#userId#${params.userId}`,
    SK: `GITHUB_MAP#githubId#${params.githubId}`,
    tableName: `user-user-${ctx.env.stage}`,
  });
