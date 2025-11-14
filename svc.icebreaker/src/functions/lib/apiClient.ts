import { ApiGatewayManagementApiClient } from "@aws-sdk/client-apigatewaymanagementapi";
import { env } from "../default.gen";

export const createApiClient = ({ domainName }: { domainName: string }) => {
  return new ApiGatewayManagementApiClient({
    region: env.awsEnv.region,
    endpoint: "https://" + domainName + "/",
  });
};
