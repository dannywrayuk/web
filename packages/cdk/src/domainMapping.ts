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
  domainExists?: boolean;
  subDomain?: string;
  basePath?: string;
};

const getDomain = (
  stack: Stack,
  config: DomainMappingConfig,
  domain: string,
  hostedZone: r53.IHostedZone,
) => {
  return apiGw.DomainName.fromDomainNameAttributes(
    stack,
    `${config.serviceName}-${config.apiName}-DomainName-${config.stage}`,
    {
      name: domain,
      regionalDomainName: domain,
      regionalHostedZoneId: hostedZone.hostedZoneId,
    },
  );
};

const createDomain = (
  stack: Stack,
  config: DomainMappingConfig,
  domain: string,
  hostedZone: r53.IHostedZone,
) => {
  const certificate = new certMan.Certificate(
    stack,
    `${config.serviceName}-${config.apiName}-Certificate-${config.stage}`,
    {
      domainName: domain,
      validation: certMan.CertificateValidation.fromDns(hostedZone),
    },
  );

  const domainName = new apiGw.DomainName(
    stack,
    `${config.serviceName}-${config.apiName}-DomainName-${config.stage}`,
    { domainName: domain, certificate },
  );

  new r53.ARecord(
    stack,
    `${config.serviceName}-${config.apiName}-ApiAliasRecord-${config.stage}`,
    {
      zone: hostedZone,
      recordName: domain,
      target: r53.RecordTarget.fromAlias(
        new r53Targets.ApiGatewayv2DomainProperties(
          domainName.regionalDomainName,
          domainName.regionalHostedZoneId,
        ),
      ),
    },
  );
  return domainName;
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

  const domainName = config.domainExists
    ? getDomain(stack, config, fullDomain, hostedZone)
    : createDomain(stack, config, fullDomain, hostedZone);

  new apiGw.ApiMapping(
    stack,
    `${config.serviceName}-${config.apiName}-ApiMapping-${config.stage}`,
    {
      api: httpApi,
      domainName: domainName,
      apiMappingKey: config.basePath,
    },
  );
};
