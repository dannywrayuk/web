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
export type UserDetails = {userId: string; name: string; username: string; avatarUrl: string; createdAt: string; email: string; githubId: string | undefined;};
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
export type ReadUserResponse = {user: UserDetails;};
export const validateReadUserResponse = (o: Record<string, any>): Result<ReadUserResponse> => {
    if (typeof o !== "object" || o === null) { return err(null, "ReadUserResponse is not an object") }
    
    const [, userError] = validateUserDetails(o.user);
    if (userError) { return err(userError, "user is not valid") }
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
