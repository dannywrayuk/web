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

export type Routes = {
  [K in keyof typeof apiGw.HttpMethod]?: Method;
} & {
  [K: string]: Routes | Method;
};

type ApiConfig = {
  name: string;
  routes: Routes;
} & apiGw.HttpApiProps;

type NestedStringRecord = object & {
  [k: string]: NestedStringRecord;
};

const insertWithin = (
  startObject: NestedStringRecord,
  keys: string[],
  insertObject: NestedStringRecord,
) =>
  Object.assign(
    keys.reduce((currentObject, nextKey) => {
      if (typeof currentObject[nextKey] === "undefined") {
        currentObject[nextKey] = {};
      }
      if (
        typeof currentObject[nextKey] !== "object" ||
        currentObject[nextKey] === null ||
        Array.isArray(currentObject[nextKey])
      ) {
        throw new Error(
          `Could not insert into ${nextKey} since it is typeof ${typeof currentObject[nextKey]}`,
        );
      }
      return currentObject[nextKey];
    }, startObject),
    insertObject,
  );

const expandFlattenedRoutes = (routes: object) => {
  return Object.entries(routes).reduce((result, [key, value]) => {
    if (key in apiGw.HttpMethod) {
      //@ts-ignore
      result[key] = "handler";
      return result;
    }
    insertWithin(result, key.split("/"), expandFlattenedRoutes(value));
    return result;
  }, {} as NestedStringRecord);
};

export const apiBuilder =
  (stack: Stack, serviceConfig: ServiceConfig) => (apiConfig: ApiConfig) => {
    const httpApi = new apiGw.HttpApi(
      stack,
      `${serviceConfig.name}-${apiConfig.name}-HttpApi-${serviceConfig.stage}`,
      {},
    );
    const routes = expandFlattenedRoutes(apiConfig.routes);
    return { api: httpApi, routes };
  };
