import {
  aws_apigatewayv2 as apiGw,
  aws_apigatewayv2_integrations as apiGwIntegrations,
  aws_certificatemanager as certMan,
  aws_lambda as lambda,
  aws_route53 as r53,
  aws_route53_targets as r53Targets,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { calculateDomain } from "./util/calculateDomain";
import { hashMap } from "./util/hashMap";
import { getStackConfig } from "./getStackConfig";

type ApiConfig = {
  endpoints?: Endpoint[];
  name?: string;
} & Partial<apiGw.HttpApiProps>;

export type Endpoint = {
  route: string;
  methods: apiGw.HttpMethod[];
  handler: lambda.IFunction;
  authorizer?: apiGw.IHttpRouteAuthorizer;
  authorizationScopes?: string[];
};

export class Api extends apiGw.HttpApi {
  constructor(scope: Construct, apiConfig: ApiConfig) {
    const stackConfig = getStackConfig(scope);
    const config = { ...stackConfig, ...apiConfig };
    const apiName = apiConfig.name ? `${apiConfig.name}-api` : "api";
    super(scope, `HttpApi-${apiConfig.name}`, {
      ...apiConfig,
      apiName: `${stackConfig.name}-${apiName}-${stackConfig.stage}`,
    });
    if (config.endpoints) {
      this.addEndpoints(config.endpoints);
    }
  }

  addEndpoints(endpoints: Endpoint[]) {
    const integrationCache = hashMap();
    endpoints.forEach((endpoint) => {
      endpoint.methods.forEach((method) => {
        new apiGw.HttpRoute(this, `Route-${endpoint.route}-${method}`, {
          httpApi: this,
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
  }

  extendDomainMapping(domainMappingConfig: {
    subDomain: string;
    domainName?: string;
    basePath?: string;
    removeStageSubdomain?: boolean;
  }) {
    const stackConfig = getStackConfig(this);
    const config = { ...stackConfig, ...domainMappingConfig };
    if (!config.domainName) {
      return;
    }

    const hostedZone = r53.HostedZone.fromLookup(this, `HostedZone`, {
      domainName: config.domainName,
    });

    const fullDomain = calculateDomain(
      config as typeof config & { domainName: string },
    );

    const domainNameConstruct = apiGw.DomainName.fromDomainNameAttributes(
      this,
      `DomainName-${fullDomain}`,
      {
        name: fullDomain,
        regionalDomainName: fullDomain,
        regionalHostedZoneId: hostedZone.hostedZoneId,
      },
    );

    new apiGw.ApiMapping(this, `ApiMapping-${fullDomain}`, {
      api: this,
      domainName: domainNameConstruct,
      apiMappingKey: config.basePath,
    });
  }

  createDomainMapping(domainMappingConfig: {
    subDomain: string;
    domainName?: string;
    basePath?: string;
    removeStageSubdomain?: boolean;
  }) {
    const stackConfig = getStackConfig(this);
    const config = { ...stackConfig, ...domainMappingConfig };
    if (!config.domainName) {
      return;
    }

    const hostedZone = r53.HostedZone.fromLookup(this, `HostedZone`, {
      domainName: config.domainName,
    });

    const fullDomain = calculateDomain(
      config as typeof config & { domainName: string },
    );
    const certificate = new certMan.Certificate(
      this,
      `Certificate-${config.stage}`,
      {
        domainName: fullDomain,
        validation: certMan.CertificateValidation.fromDns(hostedZone),
      },
    );

    const domainNameConstruct = new apiGw.DomainName(
      this,
      `DomainName-${config.stage}`,
      { domainName: fullDomain, certificate },
    );

    new apiGw.ApiMapping(this, `ApiMapping-${fullDomain}`, {
      api: this,
      domainName: domainNameConstruct,
      apiMappingKey: config.basePath,
    });

    new r53.ARecord(this, `ARecord-${fullDomain}`, {
      zone: hostedZone,
      recordName: fullDomain,
      target: r53.RecordTarget.fromAlias(
        new r53Targets.ApiGatewayv2DomainProperties(
          domainNameConstruct.regionalDomainName,
          domainNameConstruct.regionalHostedZoneId,
        ),
      ),
    });
  }
}
