import { ApiGatewayManagementApiClient } from "@aws-sdk/client-apigatewaymanagementapi";
import { env } from "../default.gen";

export const createApiClient = ({
  domainName,
  stage,
}: {
  domainName: string;
  stage: string;
}) => {
  return new ApiGatewayManagementApiClient({
    region: env.awsEnv.region,
    endpoint: "https://" + domainName + "/" + stage,
  });
};
