import { ok, error } from "@dannywrayuk/responses";
import { env, usersTable } from "./meDelete.gen.ts";
import { deleteUser } from "@dannywrayuk/schema/database/users";
import { logger } from "@dannywrayuk/logger";

export const handler = async (event: any) => {
  const tokenPayload = event.requestContext.authorizer.lambda.tokenPayload;
  logger
    .setDebug(env.stage === "dev")
    .attach({
      name: env.functionName,
      service: env.serviceName,
      stage: env.stage,
    })
    .debug("input", {
      userId: tokenPayload.sub,
    })
    .info("start");

  const sessionLength = Date.now() / 1000 - tokenPayload.sessionStarted;

  if (sessionLength > 60 * 60) {
    console.log({ message: "Session too old", sessionLength });
    return error("session too old");
  }

  const [_, removeUserError] = await deleteUser(usersTable)({
    userId: tokenPayload.sub,
  });

  if (removeUserError) {
    logger.error("Error deleting user", { error: removeUserError.message });
    return error("could not delete user");
  }

  return ok("bye");
};
