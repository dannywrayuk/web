import { dynamoDBQuery } from "@dannywrayuk/aws/dynamoDBTable";
import { dynamoDBPut, dynamoDBDelete, dynamoDBUpdate } from "@dannywrayuk/aws/dynamoDBTable";



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