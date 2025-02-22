import {
  Stack,
  aws_apigatewayv2 as apiGw,
  aws_apigatewayv2_integrations as apiGwIntegrations,
} from "aws-cdk-lib";
import { readFsRecursive } from "./util/readFsRecursive";
import { hashMapBuilder } from "./hashMapBuilder";
import { lambdaBuilder } from "./lambdaBuilder";

const defaultRoot = "./src/functions";

type ServiceConfig = { rootDir?: string } & Parameters<typeof lambdaBuilder>[1];

type Endpoint = {
  path: string;
  methods: apiGw.HttpMethod[];
  route: string;
};

const getHandlerName = (
  endpoint: Endpoint,
  config: ServiceConfig,
  handlerNames: ReturnType<typeof hashMapBuilder>,
) => {
  const parts = endpoint.route.split("/");
  parts.pop();
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

  return config.name + "-" + finalName;
};

export const fsRoutedApiBuilder = (
  stack: Stack,
  serviceConfig: ServiceConfig,
) => {
  const root = serviceConfig.rootDir || defaultRoot;
  const getFunctions = readFsRecursive(root);
  if (getFunctions.error) {
    throw getFunctions.error;
  }
  const endpoints = getFunctions.result
    .map((path) => {
      const ending = path.match(/\/([A-Z\-]+)\.ts$/);
      if (!ending || !ending[1]) {
        return null;
      }
      const methods = ending[1].split("-");
      if (!methods || !methods.every((method) => method in apiGw.HttpMethod)) {
        return null;
      }
      return {
        path,
        methods: methods as apiGw.HttpMethod[],
        route: path.replace(root, ""),
      };
    })
    .filter(Boolean) as Endpoint[];

  const integrations = hashMapBuilder();
  const handlerNames = hashMapBuilder();
  const lambda = lambdaBuilder(stack, serviceConfig);

  return (api: apiGw.HttpApi) => {
    endpoints.forEach((endpoint) => {
      const handlerName = getHandlerName(endpoint, serviceConfig, handlerNames);
      console.log({ handlerName, endpoint });
      const handler = lambda({ name: handlerName, entry: endpoint.path });
      api.addRoutes({
        path: endpoint?.route,
        methods: endpoint?.methods,
        integration: integrations.asCache(
          { functionName: handler.node.id },
          () =>
            new apiGwIntegrations.HttpLambdaIntegration(
              `Integration-${handler.node.id}`,
              handler,
            ),
        ),
      });
    });
  };
};
