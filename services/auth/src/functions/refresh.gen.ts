import { dynamoDBQuery } from "@dannywrayuk/aws/dynamoDBTable";
import { dynamoDBPut, dynamoDBDelete, dynamoDBUpdate } from "@dannywrayuk/aws/dynamoDBTable";
import { readSecret } from "@dannywrayuk/aws/readSecret";

export type LambdaEnv_dev = {
  githubUrl: string;
  githubApiUrl: string;
  cookieStages: (string)[];
} & { stage: "dev" };

export type LambdaEnv_prod = {
  githubUrl: string;
  githubApiUrl: string;
  cookieStages: (string)[];
} & { stage: "prod" };

export type CommonEnv = {
  stage: string;
  functionName: string;
  serviceName: string;
  authTokenTimeouts: {
    accessToken: number;
    refreshToken: number;
  };
  domainName: string;
  awsEnv: {
    account: string;
    region: string;
  };
};

export type LambdaEnv = CommonEnv & (LambdaEnv_dev | LambdaEnv_prod);

export const env = {
    ...process.env,
    ...((process.env.constants || {}) as unknown as object),
  } as unknown as LambdaEnv;

export const usersTableName = "core-users-dev";
export const readUsersEntry = dynamoDBQuery(usersTableName);
export const createUsersEntry = dynamoDBPut(usersTableName);
export const updateUsersEntry = dynamoDBUpdate(usersTableName);
export const deleteUsersEntry = dynamoDBDelete(usersTableName);

console.log(env)
export const getSecrets = () => readSecret(
    { stage: env.stage as string })(
    ["AUTH_ACCESS_TOKEN_SIGNING_KEY", "AUTH_REFRESH_TOKEN_SIGNING_KEY"] as const,
  );