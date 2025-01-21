import { getSecrets } from "../lib/aws/getSecrets";
import { failure, success } from "../lib/results";

export const handler = async (event: any) => {
  // const secrets = await getSecrets({
  //   accessTokenSigningKey: "AUTH_ACCESS_TOKEN_SIGNING_KEY",
  // });

  return {
    isAuthorized: false,
    context: {
      exampleKey: "exampleValue",
    },
  };
};
