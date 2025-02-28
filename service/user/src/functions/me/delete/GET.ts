import { safe } from "../../../lib/safe/safe";
import { LambdaEnv } from "./GET-env.gen";
import { getEnv } from "@dannywrayuk/aws/getEnv";
import { removeUserFromDb } from "../../../lib/removeUserFromDb";
import { failure } from "../../../lib/results";

const hourInSeconds = 60 * 60;
const env = getEnv<LambdaEnv>();

export const handler = async (event: any) => {
  const tokenPayload = event.requestContext.authorizer.lambda.tokenPayload;
  const sessionLength = Date.now() / 1000 - tokenPayload.sessionStarted;

  if (sessionLength > hourInSeconds) {
    console.log({ message: "Session too old", sessionLength });
    return failure();
  }

  const removeUser = await safe(removeUserFromDb)(
    env.userTableName,
    tokenPayload.sub,
  );

  if (removeUser.error) {
    console.error({
      message: "Failed to delete user",
      error: removeUser.error,
    });

    return failure();
  }

  // is this an anti-pattern?
  return;
};
