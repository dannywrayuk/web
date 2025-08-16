import {
  aws_apigatewayv2 as apiGw,
  aws_apigatewayv2_integrations as apiGwIntegrations,
  aws_certificatemanager as certMan,
  aws_route53 as r53,
  aws_route53_targets as r53Targets,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { calculateDomain } from "./util/calculateDomain";
import { hashMap } from "./util/hashMap";
import { getStackConfig } from "./getStackConfig";
import { Lambda } from "./lambda";
import { exportName } from "./util/exportName";

export type ApiConfig = {
  name?: string;
} & Partial<apiGw.HttpApiProps>;

export type Endpoint = {
  route: string;
  methods: string[];
  handler: Lambda;
  authorizer?: apiGw.IHttpRouteAuthorizer;
  authorizationScopes?: string[];
};

export class Api {
  public construct: apiGw.IHttpApi;
  public typeName = "Api";
  public name: string;

  constructor();
  constructor(scope: Construct, config: ApiConfig);
  constructor(scope?: Construct, config?: ApiConfig) {
    if (!scope || !config) {
      return;
    }
    const stackConfig = getStackConfig(scope);
    this.name = config.name || "main";
    const apiName = `${config.name || "main"}-api`;
    this.construct = new apiGw.HttpApi(scope, `HttpApi-${apiName}`, {
      ...config,
      apiName: `${stackConfig.name}-${apiName}-${stackConfig.stage}`,
    });
  }

  from(httpApi: apiGw.IHttpApi) {
    if (!this.name) {
      this.name = httpApi.node.id;
    }
    this.construct = httpApi;
    return this;
  }
  fromArn(scope: Construct, id: string, referenceValue: string) {
    this.name = referenceValue;
    return this.from(
      apiGw.HttpApi.fromHttpApiAttributes(scope, id, {
        httpApiId: referenceValue,
      }),
    );
  }

  export(referenceName?: string) {
    const currentStack = this.construct.stack;
    currentStack.exportValue(this.construct.apiId, {
      name: exportName({
        stackName: currentStack.stackName,
        referenceName: referenceName || this.name,
        type: this.typeName,
      }),
    });
  }

  addEndpoints(endpoints: Endpoint[]) {
    const integrationCache = hashMap();
    endpoints.forEach((endpoint) => {
      endpoint.methods.forEach((method) => {
        new apiGw.HttpRoute(
          this.construct,
          `Route-${endpoint.route}-${method}`,
          {
            httpApi: this.construct,
            routeKey: apiGw.HttpRouteKey.with(
              endpoint.route,
              method as apiGw.HttpMethod,
            ),
            authorizer: endpoint.authorizer,
            authorizationScopes: endpoint.authorizationScopes,
            integration: integrationCache.asCache(
              { functionName: endpoint.handler.construct.node.id },
              () =>
                new apiGwIntegrations.HttpLambdaIntegration(
                  `Integration-${endpoint.handler.construct.node.id}`,
                  endpoint.handler.construct,
                ),
            ),
          },
        );
      });
    });
  }

  extendDomainMapping(domainMappingConfig: {
    subDomain: string;
    domainName?: string;
    basePath?: string;
    removeStageSubdomain?: boolean;
  }) {
    const stackConfig = getStackConfig(this.construct);
    const config = { ...stackConfig, ...domainMappingConfig };
    if (!config.domainName) {
      return;
    }

    const hostedZone = r53.HostedZone.fromLookup(this.construct, `HostedZone`, {
      domainName: config.domainName,
    });

    const fullDomain = calculateDomain(
      config as typeof config & { domainName: string },
    );

    const domainNameConstruct = apiGw.DomainName.fromDomainNameAttributes(
      this.construct,
      `DomainName-${fullDomain}`,
      {
        name: fullDomain,
        regionalDomainName: fullDomain,
        regionalHostedZoneId: hostedZone.hostedZoneId,
      },
    );

    new apiGw.ApiMapping(this.construct, `ApiMapping-${fullDomain}`, {
      api: this.construct,
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
    const stackConfig = getStackConfig(this.construct);
    const config = { ...stackConfig, ...domainMappingConfig };
    if (!config.domainName) {
      return;
    }

    const hostedZone = r53.HostedZone.fromLookup(this.construct, `HostedZone`, {
      domainName: config.domainName,
    });

    const fullDomain = calculateDomain(
      config as typeof config & { domainName: string },
    );
    const certificate = new certMan.Certificate(
      this.construct,
      `Certificate-${config.stage}`,
      {
        domainName: fullDomain,
        validation: certMan.CertificateValidation.fromDns(hostedZone),
      },
    );

    const domainNameConstruct = new apiGw.DomainName(
      this.construct,
      `DomainName-${config.stage}`,
      { domainName: fullDomain, certificate },
    );

    new apiGw.ApiMapping(this.construct, `ApiMapping-${fullDomain}`, {
      api: this.construct,
      domainName: domainNameConstruct,
      apiMappingKey: config.basePath,
    });

    new r53.ARecord(this.construct, `ARecord-${fullDomain}`, {
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
