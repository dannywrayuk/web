import {
  aws_apigatewayv2 as apiGw,
  aws_apigatewayv2_integrations as apiGwIntegrations,
  aws_certificatemanager as certMan,
  aws_route53 as r53,
  aws_route53_targets as r53Targets,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { calculateDomain } from "./util/calculateDomain.ts";
import { hashMap } from "./util/hashMap.ts";
import { getStackConfig } from "./getStackConfig.ts";
import { Lambda } from "./lambda.ts";
import { exportName } from "./util/exportName.ts";

export type ApiConfig = {
  name: string;
  corsPreflight?: Omit<apiGw.CorsPreflightOptions, "allowMethods"> & {
    allowMethods: (
      | "GET"
      | "POST"
      | "PUT"
      | "DELETE"
      | "OPTIONS"
      | "HEAD"
      | "PATCH"
      | "ANY"
    )[];
  };
} & Omit<Partial<apiGw.HttpApiProps>, "corsPreflight">;

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
  public fullName: string;

  constructor();
  constructor(scope: Construct, config: ApiConfig);
  constructor(scope?: Construct, config?: ApiConfig) {
    if (!scope || !config) {
      return;
    }
    const stackConfig = getStackConfig(scope);
    this.name = config.name;
    this.fullName = `${stackConfig.name}-${this.name}-api-${stackConfig.stage}`;
    this.construct = new apiGw.HttpApi(scope, `HttpApi-${this.name}-api`, {
      ...(config as apiGw.HttpApiProps),
      apiName: this.fullName,
    });
  }

  from(httpApi: apiGw.IHttpApi) {
    this.construct = httpApi;
    return this;
  }
  fromArn(
    scope: Construct,
    id: string,
    referenceValue: string,
    referenceName: string,
    fullName: string,
  ) {
    this.name = referenceName;
    this.fullName = fullName;
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
    const integrationCache = hashMap<apiGw.HttpRouteIntegration>();
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
    return this;
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
      return this;
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
    return this;
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
      return this;
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
    return this;
  }
}
