import {
  Stack,
  aws_apigatewayv2 as apiGw,
  aws_lambda as lambda,
} from "aws-cdk-lib";
import { domainMapping } from "./domainMapping";
import { addHttpApiEndpoints } from "./addHttpApiEndpoints";

type ApiConfig = {
  endpoints?: Endpoint[];
  name?: string;
  domainName?: string;
  domainExists?: boolean;
  subDomain?: string;
  basePath?: string;
} & apiGw.HttpApiProps;

type ServiceConfig = {
  name: string;
  stage: string;
  removeStageSubdomain?: boolean;
} & Partial<ApiConfig>;

export type Endpoint = {
  route: string;
  methods: apiGw.HttpMethod[];
  handler: lambda.IFunction;
  authorizer?: apiGw.IHttpRouteAuthorizer;
  authorizationScopes?: string[];
};

export const httpApiBuilder =
  (stack: Stack, serviceConfig: ServiceConfig) => (apiConfig: ApiConfig) => {
    const apiName = apiConfig.name ? `${apiConfig.name}-api` : "api";
    const httpApi = new apiGw.HttpApi(
      stack,
      `${serviceConfig.name}-${apiName}-${serviceConfig.stage}`,
      {
        defaultAuthorizer:
          serviceConfig.defaultAuthorizer || apiConfig.defaultAuthorizer,
      },
    );

    const domainName = serviceConfig.domainName || apiConfig.domainName;
    const subDomain = serviceConfig.subDomain || apiConfig.subDomain;

    if (domainName) {
      domainMapping(stack, httpApi, {
        basePath: apiConfig.basePath,
        serviceName: serviceConfig.name,
        stage: serviceConfig.stage,
        domainExists: apiConfig.domainExists,
        apiName,
        domainName,
        subDomain: serviceConfig.removeStageSubdomain
          ? subDomain
          : subDomain
            ? `${subDomain}.${serviceConfig.stage}`
            : serviceConfig.stage,
      });
    }
    addHttpApiEndpoints(stack, httpApi, apiConfig.endpoints || []);
    return { api: httpApi, endpoints: apiConfig.endpoints };
  };
