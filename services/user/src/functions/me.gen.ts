import { dynamoDBQuery } from "@dannywrayuk/aws/dynamoDBTable";

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

export const env = {
    ...process.env,
    ...((process.env.constants || {}) as unknown as object),
  } as unknown as LambdaEnv;

export const usersTableName = "core-users-dev";
export const readUsersEntry = dynamoDBQuery(usersTableName);