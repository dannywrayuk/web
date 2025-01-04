import { getSecrets } from "../lib/getSecrets";
import { failure, success } from "../lib/results";

export const handler = async (event: any) => {
  const secrets = await getSecrets({
    accessTokenSigningKey: "AUTH_ACCESS_TOKEN_SIGNING_KEY",
  });
  const accessToken = event.headers.accessToken;

  if (!accessToken) {
    return failure();
  }

  return success();
};
