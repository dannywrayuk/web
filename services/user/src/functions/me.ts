import { success } from "../lib/results";
import { getSecrets, readUsers } from "./me-env.gen";

export const handler = async (event: any) => {
  const userId = event.requestContext.authorizer.lambda.tokenPayload.sub;
  const userData = await readUsers({ PK: `USER_ID#${userId}`, SK: "RECORD" });
  const secrets = await getSecrets();
  secrets;

  if (userData?.length !== 1) {
    console.log("user not found");
    return { statusCode: 404, body: "User not found" };
  }

  const { PK, SK, ...user } = userData[0];

  return success(user);
};
