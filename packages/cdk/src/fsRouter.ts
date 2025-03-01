import fs from "node:fs";
import path from "node:path";
import { casing } from "@dannywrayuk/casing";
import { aws_apigatewayv2 as apiGw, Stack } from "aws-cdk-lib";
import { hashMapBuilder } from "./hashMapBuilder";
import { Endpoint } from "./httpApiBuilder";
import { lambdaBuilder } from "./lambdaBuilder";

const defaultRoot = "./src/functions";

type ServiceConfig = {
  rootDir?: string;
  authorizers?: Record<string, apiGw.IHttpRouteAuthorizer>;
  defaultAuthorizer?: apiGw.IHttpRouteAuthorizer;
  defaultAuthorizationScopes?: string[];
} & Parameters<typeof lambdaBuilder>[1];

type EndpointData = {
  route: string;
  methods: apiGw.HttpMethod[];
  entry: string;
  authorizerName?: string;
  authorizationScopes?: string[];
};

const getHandlerName = (
  endpoint: EndpointData,
  handlerNames: ReturnType<typeof hashMapBuilder>,
) => {
  const parts = endpoint.route.split("/");
  parts.push(...endpoint.methods);
  const filtered = parts.filter(
    (part) => !!part && /^[0-9a-zA-Z]+$/.test(part),
  );
  const name = filtered.join("-");
  if (handlerNames.get(name)) {
    let i = 2;
    while (handlerNames.get(name + "-" + i)) {
      i++;
    }
    filtered.push(i.toString());
  }
  const finalName = filtered.join("-");

  handlerNames.set(finalName, true);

  return casing.camel(finalName);
};

const toEndpoint = (handlerPath: string, parent: ParentOptions) => {
  const ending = handlerPath.match(/\/([A-Z\-]+)\.ts$/);
  if (!ending || !ending[1]) {
    return null;
  }
  const methods = ending[1].split("-");
  if (!methods || !methods.every((method) => method in apiGw.HttpMethod)) {
    return null;
  }
  return {
    entry: handlerPath,
    methods: methods as apiGw.HttpMethod[],
    route: path.dirname(handlerPath.replace(parent.root, "")),
    authorizerName: parent.authorizerName,
    authorizationScopes: parent.authorizationScopes,
  };
};

type ParentOptions = {
  root: string;
  path: string;
  authorizerName?: string;
  authorizationScopes?: string[];
};

const getRouteOptions = (
  parent: ParentOptions,
  currentDirectoryList: string[],
) => {
  if (currentDirectoryList.includes("routeOptions.ts")) {
    return require(path.join(process.cwd(), parent.path, `routeOptions.ts`))
      ?.routeOptions;
  }
  return {};
};

const getEndpointOptions = (entry: string) => {
  return require(path.join(process.cwd(), entry))?.endpointOptions || {};
};

const recursiveBuilder = (parent: ParentOptions) => {
  const currentDirectoryList = fs.readdirSync(parent.path);
  const routeOptions = getRouteOptions(parent, currentDirectoryList);
  return currentDirectoryList.reduce((acc, fileOrDirectoryName) => {
    const fullPath = `${parent.path}/${fileOrDirectoryName}`;
    if (fs.statSync(fullPath).isDirectory()) {
      const children = recursiveBuilder({
        ...parent,
        path: fullPath,
        ...routeOptions,
      });
      acc.push(...children);
      return acc;
    }
    if (fileOrDirectoryName.endsWith("routeOptions.ts")) {
      return acc;
    }
    const endpoint = toEndpoint(fullPath, { ...parent, ...routeOptions });
    if (endpoint) {
      acc.push(endpoint);
    }
    return acc;
  }, [] as EndpointData[]);
};

export const fsRouter = (stack: Stack, serviceConfig: ServiceConfig) => {
  const root = serviceConfig.rootDir || defaultRoot;
  const endpoints = recursiveBuilder({
    root,
    path: root,
  });
  const handlerNames = hashMapBuilder();
  const lambda = lambdaBuilder(stack, serviceConfig);
  return endpoints.map((endpoint) => {
    const handlerName = getHandlerName(endpoint, handlerNames);
    const handler = lambda({
      name: handlerName,
      entry: endpoint.entry,
    });
    // I think this needs some work, dont like that i have to read the at buildtime
    const endpointOptions = getEndpointOptions(endpoint.entry);
    return {
      route: endpoint.route,
      methods: endpoint.methods,
      authorizer:
        serviceConfig?.authorizers?.[
          (endpointOptions.authorizerName ||
            endpoint.authorizerName) as keyof typeof serviceConfig.authorizers
        ] || serviceConfig.defaultAuthorizer,
      authorizationScopes:
        endpointOptions.authorizationScopes ||
        endpoint.authorizationScopes ||
        serviceConfig.defaultAuthorizationScopes,
      handler,
    };
  }) as Endpoint[];
};
