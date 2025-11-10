import { app, Config } from "@dannywrayuk/cdk";
import {
  aws_apigatewayv2 as apigwv2,
  aws_apigatewayv2_integrations as apigwv2Int,
} from "aws-cdk-lib";

export const config = new Config(
  {
    name: "icebreaker",
    domainName: "dannywray.co.uk",
  },
  {
    dev: {},
    prod: {
      removeStageSubdomain: true,
      deletionProtection: true,
    },
  },
);

export const runtimeConfig = new Config(
  {},
  {
    dev: {},
    prod: {},
  },
);

app(config, ({ Lambda, Table, stack }) => {
  const stateTable = new Table({
    name: "state",
  });
  const defaultLambda = new Lambda({
    name: "default",
    runtimeConfig,
  }).grantTableReadWrite(stateTable);

  const api = new apigwv2.WebSocketApi(stack, "icebreakerApi", {
    apiName: "icebreaker-" + config.current.stage,
    defaultRouteOptions: {
      integration: new apigwv2Int.WebSocketLambdaIntegration(
        "default-integration",
        defaultLambda.construct,
      ),
    },
  });

  new apigwv2.WebSocketStage(stack, "icebreakerApi-stage", {
    webSocketApi: api,
    stageName: "default",
    autoDeploy: true,
  });

  api.grantManageConnections(defaultLambda.construct);
});
