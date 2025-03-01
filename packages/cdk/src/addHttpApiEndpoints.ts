import {
  Stack,
  aws_apigatewayv2 as apiGw,
  aws_apigatewayv2_integrations as apiGwIntegrations,
} from "aws-cdk-lib";
import { Endpoint } from "./httpApiBuilder";
import { hashMapBuilder } from "./hashMapBuilder";

export const addHttpApiEndpoints = (
  stack: Stack,
  httpApi: apiGw.IHttpApi,
  endpoints: Endpoint[],
) => {
  const integrationCache = hashMapBuilder();
  endpoints.forEach((endpoint) => {
    endpoint.methods.forEach((method) => {
      new apiGw.HttpRoute(stack, `${httpApi.node.id}-${endpoint.route}`, {
        httpApi,
        routeKey: apiGw.HttpRouteKey.with(endpoint.route, method),
        authorizer: endpoint.authorizer,
        authorizationScopes: endpoint.authorizationScopes,
        integration: integrationCache.asCache(
          { functionName: endpoint.handler.node.id },
          () =>
            new apiGwIntegrations.HttpLambdaIntegration(
              `Integration-${endpoint.handler.node.id}`,
              endpoint.handler,
            ),
        ),
      });
    });
  });
};
