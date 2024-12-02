import {
  Stack,
  aws_apigatewayv2 as apiGw,
  aws_lambda as lambda,
} from "aws-cdk-lib";

type ServiceConfig = {
  name: string;
  stage: string;
} & apiGw.HttpApiProps;

type Method =
  | {
      handler: lambda.IFunction;
    }
  | lambda.IFunction;

export type Resources = {
  [K in keyof typeof apiGw.HttpMethod]?: Method;
} & {
  [K: string]: Resources | Method;
};

type ApiConfig = {
  name: string;
  resources: Resources;
} & apiGw.HttpApiProps;

export const apiBuilder =
  (stack: Stack, serviceConfig: ServiceConfig) => (apiConfig: ApiConfig) => {
    const httpApi = new apiGw.HttpApi(
      stack,
      `${serviceConfig.name}-${apiConfig.name}-HttpApi-${serviceConfig.stage}`,
      {},
    );
    return { api: httpApi };
  };
