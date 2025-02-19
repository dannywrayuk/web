import {
  Stack,
  aws_apigatewayv2 as apiGw,
  aws_apigatewayv2_integrations as apiGwIntegrations,
  aws_lambda as lambda,
} from "aws-cdk-lib";
import { HashMap, hashMapBuilder } from "./hashMapBuilder";
import { domainMapping } from "./domainMapping";

type ApiConfig = {
  routes: Routes;
  name?: string;
  domainName?: string;
  subDomain?: string;
} & apiGw.HttpApiProps;

type ServiceConfig = {
  name: string;
  stage: string;
  removeStageSubdomain?: boolean;
} & Partial<ApiConfig>;

type Method = {
  handler: lambda.IFunction;
  authorizer?: apiGw.IHttpRouteAuthorizer;
} & apiGwIntegrations.HttpLambdaIntegrationProps;

// still not sure if this is the best way to type this
// apparently (string & {}) stops typescript from widening the type to string
type Routes =
  | {
      [K in
        | keyof typeof apiGw.HttpMethod
        | "routeAuthorizer"
        | (string & {})]?: K extends keyof typeof apiGw.HttpMethod
        ? Method | lambda.IFunction
        : K extends "routeAuthorizer"
          ? apiGw.IHttpRouteAuthorizer
          : Routes;
    }
  | {
      [K in
        | keyof typeof apiGw.HttpMethod
        | "routeAuthorizer"]?: K extends keyof typeof apiGw.HttpMethod
        ? Method | lambda.IFunction
        : apiGw.IHttpRouteAuthorizer;
    };

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
  parentAuthorizer?: apiGw.IHttpRouteAuthorizer,
) => {
  Object.entries(routes).forEach(([key, value]) => {
    if (key in apiGw.HttpMethod) {
      const { handler, authorizer, ...options } = value as Method;
      httpApi.addRoutes({
        path: parentRoute || "/",
        methods: [key as apiGw.HttpMethod],
        authorizer: authorizer || parentAuthorizer,
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
      const { routeAuthorizer, ...routes } = value as Routes;
      createRoutes(
        httpApi,
        routes,
        integrations,
        `${parentRoute || ""}/${key}`,
        parentAuthorizer || routeAuthorizer,
      );
    }
  });
};

export const httpApiBuilder =
  (stack: Stack, serviceConfig: ServiceConfig) => (apiConfig: ApiConfig) => {
    const apiName = apiConfig.name ? `${apiConfig.name}-api` : "api";
    const httpApi = new apiGw.HttpApi(
      stack,
      `${serviceConfig.name}-${apiName}-${serviceConfig.stage}`,
      {},
    );

    const domainName = serviceConfig.domainName || apiConfig.domainName;
    const subDomain = serviceConfig.subDomain || apiConfig.subDomain;

    if (domainName) {
      domainMapping(stack, httpApi, {
        serviceName: serviceConfig.name,
        stage: serviceConfig.stage,
        apiName,
        domainName,
        subDomain: serviceConfig.removeStageSubdomain
          ? subDomain
          : subDomain
            ? `${subDomain}.${serviceConfig.stage}`
            : serviceConfig.stage,
      });
    }

    const routeTree = expandFlattenedRoutes(apiConfig.routes);
    const integrations = hashMapBuilder();
    createRoutes(httpApi, routeTree, integrations);
    return { api: httpApi };
  };
