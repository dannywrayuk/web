import {
  Stack,
  aws_apigatewayv2 as apiGw,
  aws_route53 as r53,
  aws_route53_targets as r53Targets,
  aws_certificatemanager as certMan,
} from "aws-cdk-lib";

type DomainMappingConfig = {
  serviceName: string;
  apiName: string;
  stage: string;
  domainName: string;
  subDomain?: string;
};

export const domainMapping = (
  stack: Stack,
  httpApi: apiGw.HttpApi,
  config: DomainMappingConfig,
) => {
  const hostedZone = r53.HostedZone.fromLookup(
    stack,
    `${config.serviceName}-${config.apiName}-HostedZone-${config.stage}`,
    { domainName: config.domainName },
  );

  const fullDomain = config.subDomain
    ? `${config.subDomain}.${config.domainName}`
    : config.domainName;

  const certificate = new certMan.Certificate(
    stack,
    `${config.serviceName}-${config.apiName}-Certificate-${config.stage}`,
    {
      domainName: fullDomain,
      validation: certMan.CertificateValidation.fromDns(hostedZone),
    },
  );

  const domainName = new apiGw.DomainName(
    stack,
    `${config.serviceName}-${config.apiName}-DomainName-${config.stage}`,
    { domainName: fullDomain, certificate },
  );

  new r53.ARecord(
    stack,
    `${config.serviceName}-${config.apiName}-ApiAliasRecord-${config.stage}`,
    {
      zone: hostedZone,
      recordName: fullDomain,
      target: r53.RecordTarget.fromAlias(
        new r53Targets.ApiGatewayv2DomainProperties(
          domainName.regionalDomainName,
          domainName.regionalHostedZoneId,
        ),
      ),
    },
  );

  new apiGw.ApiMapping(
    stack,
    `${config.serviceName}-${config.apiName}-ApiMapping-${config.stage}`,
    { api: httpApi, domainName },
  );
};
