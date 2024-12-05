import {
  Stack,
  aws_apigatewayv2 as apiGw,
  aws_apigatewayv2_integrations as apiGwIntegrations,
  aws_lambda as lambda,
} from "aws-cdk-lib";
import { HashMap, hashMapBuilder } from "./hashMapBuilder";

type ServiceConfig = {
  name: string;
  stage: string;
} & apiGw.HttpApiProps;

type Method = {
  handler: lambda.IFunction;
} & apiGwIntegrations.HttpLambdaIntegrationProps;

export type Routes = {
  [K in keyof typeof apiGw.HttpMethod]?: Method | lambda.IFunction;
} & {
  [K: string]: Routes | Method | lambda.IFunction;
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
      if (value?.handler) {
        result[key] = value;
      } else {
        result[key] = { handler: value };
      }
      return result;
    }
    insertWithin(result, key.split("/"), expandFlattenedRoutes(value));
    return result;
  }, {} as NestedStringRecord);
};

const createRoutes = (
  httpApi: apiGw.HttpApi,
  routes: Routes,
  integrations: HashMap,
  parentRoute?: string,
) => {
  Object.entries(routes).forEach(([key, value]) => {
    if (key in apiGw.HttpMethod) {
      console.log(`${parentRoute} ${key}`);
      const { handler, ...options } = value as Method;
      httpApi.addRoutes({
        path: parentRoute || "/",
        methods: [key as apiGw.HttpMethod],
        integration: integrations.asCache(
          { functionName: handler.node.id, options },
          () =>
            new apiGwIntegrations.HttpLambdaIntegration(
              `Integration-${handler.node.id}`,
              handler,
              options,
            ),
        ),
      });
    } else {
      createRoutes(
        httpApi,
        value as Routes,
        integrations,
        `${parentRoute || ""}/${key}`,
      );
    }
  });
};

export const httpApiBuilder =
  (stack: Stack, serviceConfig: ServiceConfig) => (apiConfig: ApiConfig) => {
    const httpApi = new apiGw.HttpApi(
      stack,
      `${serviceConfig.name}-${apiConfig.name}-HttpApi-${serviceConfig.stage}`,
      {},
    );

    const routeTree = expandFlattenedRoutes(apiConfig.routes);
    const integrations = hashMapBuilder();
    createRoutes(httpApi, routeTree, integrations);
    return { api: httpApi };
  };
