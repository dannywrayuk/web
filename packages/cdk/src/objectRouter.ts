import {
  aws_apigatewayv2 as apiGw,
  aws_apigatewayv2_integrations as apiGwIntegrations,
  aws_lambda as lambda,
} from "aws-cdk-lib";
import { Endpoint } from "./httpApiBuilder";

type Method = {
  handler: lambda.IFunction;
  authorizer?: apiGw.IHttpRouteAuthorizer;
} & apiGwIntegrations.HttpLambdaIntegrationProps;

type EndpointOptions = {
  authorizer?: apiGw.IHttpRouteAuthorizer;
  authorizationScopes?: string[];
};

type RouteOptions = {
  authorizer?: apiGw.IHttpRouteAuthorizer;
  authorizationScopes?: string[];
};

// still not sure if this is the best way to type this
// apparently (string & {}) stops typescript from widening the type to string
export type Routes =
  | {
      [K in
        | keyof typeof apiGw.HttpMethod
        | "routeOptions"
        | (string & {})]?: K extends keyof typeof apiGw.HttpMethod
        ? Method | lambda.IFunction
        : K extends "routeOptions"
          ? RouteOptions
          : Routes;
    }
  | {
      [K in
        | keyof typeof apiGw.HttpMethod
        | "routeOptions"]?: K extends keyof typeof apiGw.HttpMethod
        ? Method | lambda.IFunction
        : RouteOptions;
    };

const buildEndpoint = (
  route: string,
  methods: apiGw.HttpMethod[],
  value: Method | lambda.IFunction,
  options: EndpointOptions,
): Endpoint => {
  if ("handler" in value) {
    return { ...options, ...value, route, methods };
  }
  return {
    ...options,
    route,
    methods,
    handler: value,
  };
};

type ParentRoute = {
  route: string;
  authorizer?: apiGw.IHttpRouteAuthorizer;
  authorizationScopes?: string[];
};

const recursiveBuilder = (routes: Routes, parent?: ParentRoute) => {
  return Object.entries(routes).reduce((result, [key, value]) => {
    const authorizer = routes.routeOptions?.authorizer || parent?.authorizer;
    const authorizationScopes =
      routes.routeOptions?.authorizationScopes || parent?.authorizationScopes;
    if (key === "routeOptions") {
      return result;
    }
    if (key in apiGw.HttpMethod) {
      result.push(
        buildEndpoint(
          parent?.route || "/",
          [key as apiGw.HttpMethod],
          value as Method | lambda.IFunction,
          {
            authorizer,
            authorizationScopes,
          },
        ),
      );
    } else if (key.split("-").every((part) => part in apiGw.HttpMethod)) {
      result.push(
        buildEndpoint(
          parent?.route || "/",
          key.split("-") as apiGw.HttpMethod[],
          value as Method | lambda.IFunction,
          {
            authorizer,
            authorizationScopes,
          },
        ),
      );
    } else {
      result.push(
        ...recursiveBuilder(value as Routes, {
          route: `${parent?.route || ""}/${key}`,
          authorizer,
          authorizationScopes,
        }),
      );
    }
    return result;
  }, [] as Endpoint[]);
};

export const objectRouter = (routes: Routes): Endpoint[] => {
  return recursiveBuilder(routes);
};
