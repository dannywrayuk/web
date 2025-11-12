import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { logger } from "@dannywrayuk/logger";
import { unsafe } from "@dannywrayuk/results";

export const replyToConnection = async (
  client: ApiGatewayManagementApiClient,
  connectionId: string,
  payload: object,
) => {
  const [_, err] = await unsafe(() => {
    return client.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(payload)),
      }),
    );
  })();
  if (err) {
    logger.error("Error replying to connection:", { error: err.message });
  }
};
