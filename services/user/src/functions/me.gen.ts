import { dynamoDBQuery } from "@dannywrayuk/aws/dynamoDBTable";
import { dynamoDBPut, dynamoDBDelete, dynamoDBUpdate } from "@dannywrayuk/aws/dynamoDBTable";
import {readSecret} from "@dannywrayuk/aws/readSecret";




export type LambdaEnv_dev = {} & { stage: "dev" };

export type LambdaEnv_prod = {} & { stage: "prod" };

export type CommonEnv = {
  stage: string;
  functionName: string;
  serviceName: string;
  awsEnv: {
    account: string;
    region: string;
  };
};

export type LambdaEnv = CommonEnv & (LambdaEnv_dev | LambdaEnv_prod);

export const readUsers = dynamoDBQuery("users");

export const createUsers = dynamoDBPut("users");
export const updateUsers = dynamoDBUpdate("users");
export const deleteUsers = dynamoDBDelete("users");

export const getSecrets = () => readSecret(
    { stage: process.env.stage as string })(
    ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "AUTH_ACCESS_TOKEN_SIGNING_KEY", "AUTH_REFRESH_TOKEN_SIGNING_KEY"] as const,
  );
