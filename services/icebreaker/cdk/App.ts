import { app, Config } from "@dannywrayuk/cdk";
import {
  aws_apigatewayv2 as apigwv2,
  aws_apigatewayv2_integrations as apigwv2Int,
  aws_certificatemanager as certMan,
  aws_route53 as r53,
  aws_route53_targets as r53Targets,
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
  api.grantManageConnections(defaultLambda.construct);

  const fullDomain = `icebreaker-ws.${config.current.stage === "dev" ? "dev." : ""}${config.current.domainName}`;
  const hostedZone = r53.HostedZone.fromLookup(stack, `HostedZone`, {
    domainName: config.current.domainName,
  });

  const certificate = new certMan.Certificate(
    stack,
    `Certificate-${config.current.stage}`,
    {
      domainName: fullDomain,
      validation: certMan.CertificateValidation.fromDns(hostedZone),
    },
  );

  const domainNameConstruct = new apigwv2.DomainName(
    stack,
    `DomainName-${config.common.stage}`,
    { domainName: fullDomain, certificate },
  );
  new apigwv2.WebSocketStage(stack, "icebreakerApi-stage", {
    webSocketApi: api,
    stageName: "default",
    autoDeploy: true,
    domainMapping: {
      domainName: domainNameConstruct,
    },
  });
  new r53.ARecord(stack, `ARecord-${fullDomain}`, {
    zone: hostedZone,
    recordName: fullDomain,
    target: r53.RecordTarget.fromAlias(
      new r53Targets.ApiGatewayv2DomainProperties(
        domainNameConstruct.regionalDomainName,
        domainNameConstruct.regionalHostedZoneId,
      ),
    ),
  });
});
