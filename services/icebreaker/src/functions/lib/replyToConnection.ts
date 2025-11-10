import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { unsafe } from "@dannywrayuk/results";

export const replyToConnection = async (
  client: ApiGatewayManagementApiClient,
  connectionId: string,
  payload: object,
) => {
  return unsafe(() => {
    return client.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(payload)),
      }),
    );
  })();
};
